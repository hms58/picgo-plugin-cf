import picgo from 'picgo'

/**
 * 上传文件
 * doc: https://content.dropboxapi.com/2/files/upload
 */
// export const uploadFile = async (url, requestPath, authorization, token, fileId, file, ctx: picgo) => {
export const uploadFile = async (apiHost: string, accessToken: string, filePath: string, fileData, ctx: picgo) => {
  const url = `${apiHost}${filePath}`
  try {
    const data = await ctx.Request.request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': `Bearer ${accessToken}`,
        // 'Dropbox-API-Arg': `{"path": "${filePath}","mode": "overwrite","autorename": true,"mute": false}`,
      },
      url,
      body: fileData,
    })
    return data
  } catch (error) {
    ctx.log.warn('#dropbox: 上传文件失败...')
    throw error
  }
}

/**
 * 下载图片
 * doc: /https://content.dropboxapi.com/2/files/download
 */
export const batchDownloadFile = async (apiHost: string, filepath: string, ctx: picgo) => {
  const url = `${apiHost}${filepath}`
  try {
    const data = await ctx.Request.request({
      method: 'GET',
      headers: {
      },
      url: url,
    })
    return data
  } catch (error) {
    ctx.log.warn('#dropbox: 下载图片失败...')
    throw error
  }
}

export const deleteFile = async (apiHost: string, accessToken: string, filepath: string, ctx: picgo) => {
	const url = `${apiHost}${filepath}`
	try {
	  const data = await ctx.Request.request({
		method: 'DELETE',
		headers: {
		   'Authorization': `Bearer ${accessToken}`,
		},
		url: url,
	  })
	  return data
	} catch (error) {
	  ctx.log.warn('#dropbox: 删除图片失败...')
	  throw error
	}
  }
