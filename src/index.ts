import { uploadFile, batchDownloadFile } from './cf';
import picgo from 'picgo'
import { userConfig } from './interface'

const handle = async (ctx: picgo): Promise<picgo> => {
  const userConfig: userConfig = ctx.getConfig('picBed.cf')
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

const config = (ctx: picgo) => {
  let userConfig: userConfig = ctx.getConfig('picBed.cf')
  if (!userConfig) {
    userConfig = {
      apiHost: '',
      accessToken: '',
      path: '/images/',
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
  ]
  return config
}

export = (ctx: picgo) => {
  const register = () => {
    ctx.helper.uploader.register('cf', {
      handle,
      name: 'dropbox uploader via cloudflare proxy',
      config
    })
  }
  return {
    uploader: 'cf',
    register
  }
}
