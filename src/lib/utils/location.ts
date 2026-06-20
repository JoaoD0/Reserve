export function getDirectionsUrl(lat: number, lng: number, name: string): string {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`;
}

export function getDirectionsUrlFromAddress(address: string, name?: string): string {
  const query = encodeURIComponent(name ? `${name}, ${address}` : address);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?q=${query}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
