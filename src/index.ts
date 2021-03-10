import { uploadFile, deleteFile } from './cf';
import picgo from 'picgo'
import { userConfig } from './interface'
// import dayjs from 'dayjs'

const PluginName = 'picgo-plugin-cf'
const UploaderName = 'cf';

const handle = async (ctx: picgo): Promise<picgo> => {
  const userConfig: userConfig = ctx.getConfig('picBed.'+UploaderName)
  if (!userConfig) { throw new Error('找不到dropbox配置') }
  const { apiHost, path, accessToken } = userConfig
  try {
    let imgList = ctx.output
    for (let i in imgList) {
      const realPath = `${path}${imgList[i].fileName}`
      let image = imgList[i].buffer
      if (!image && imgList[i].base64Image) {
        image = Buffer.from(imgList[i].base64Image, 'base64')
      }
      const body = await uploadFile(apiHost, accessToken, realPath, image, ctx)
       let obj = JSON.parse(body);
       if (obj.is_downloadable === true) {
          delete imgList[i].base64Image;
          delete imgList[i].buffer;
          imgList[i]['imgUrl'] = `${apiHost}${obj.path_lower}`;
        }
        else {
          ctx.emit('notification', {
            title: '上传失败',
            body: body
          });
          throw new Error(body);
        }
    }
    return ctx
  } catch (error) {
    ctx.log.error(error)
    ctx.emit('notification', {
      title: '上传失败',
      body: error.message
    })
  }
}

// function getNow () {
// 	return dayjs().format('YYYY-MM-DD hh:mm:ss')
// }

async function onRemove (files, { showNotification }) {
	const rms = files.filter(each => each.type === UploaderName)
	if (rms.length === 0) return

	const self: picgo = this
	let userConfig: userConfig = self.getConfig('picBed.'+UploaderName)
	if (!userConfig) { throw new Error('找不到dropbox配置') }
  	const { apiHost, path, accessToken, syncDelete } = userConfig
	if (!syncDelete) {
		return;
	}

	const fail = []
	for (let i = 0; i < rms.length; i++) {
		const each = rms[i]
		const realPath = `${path}${each.fileName}`
		await deleteFile(apiHost, accessToken, realPath, self).catch((e) => {
			self.log.error(e)
			fail.push(each)
		})
	}
	// if (fail.length) {
	// 	// 确保主线程已经把文件从data.json删掉
	// 	const uploaded  = self.getConfig('uploaded')
	// 	uploaded.unshift(...fail)
	// 	self.saveConfig({
	// 	uploaded,
	// 	[PluginName]: {
	// 		lastSync: getNow()
	// 	}
	// 	})
	// }

    self.emit('notification', {
      title: 'cf 删除提示',
      body: fail.length === 0 ? '成功同步删除' : `删除失败${fail.length}个`
    })
}

const config = (ctx: picgo) => {
  let userConfig: userConfig = ctx.getConfig('picBed.'+UploaderName)
  if (!userConfig) {
    userConfig = {
      apiHost: '',
      accessToken: '',
      path: '/images/',
	  syncDelete: false,
    }
  }
  const config = [
    {
      name: 'accessToken',
      type: 'password',
      default: userConfig.accessToken,
      message: 'accessToken 不能为空',
      required: true,
      alias: 'accessToken'
    },
    {
      name: 'apiHost',
      type: 'input',
      default: userConfig.apiHost,
      message: 'apiHost 不能为空',
      required: true,
      alias: 'apiHost'
    },
    {
      name: 'path',
      type: 'input',
      default: userConfig.path,
      message: '上传路径目录不能为空(以/开头，需要以/结尾)',
      required: true,
      alias: 'pathPrefix'
    },
	{
		name: 'syncDelete',
		type: 'input',
		default: userConfig.syncDelete,
		message: '是否同步删除数据',
		required: true,
		alias: 'syncDelete'
	  },
  ]
  return config
}

export = (ctx: picgo) => {
  const register = () => {
    ctx.helper.uploader.register(UploaderName, {
      handle,
      name: 'cf uploader',
      config
    })
    ctx.on('remove', onRemove)
  }
  return {
    uploader: UploaderName,
    register
  }
}
