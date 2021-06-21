export const configs = {
  title: '静かな森',
  ipv6LoopupApiUrl:
    import.meta.env.VITE_APP_IPV6_LOOKUP_API_URL ?? 'http://ip-api.com/json/',
  amapKey: import.meta.env.VITE_APP_GAODEMAP_KEY ?? '',
}
