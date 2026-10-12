interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.hostname === 'krmznkr.com') {
      url.protocol = 'https:'
      url.hostname = 'me.krmznkr.com'
      url.port = ''
      return Response.redirect(url.href, 301)
    }
    return env.ASSETS.fetch(request)
  },
}
