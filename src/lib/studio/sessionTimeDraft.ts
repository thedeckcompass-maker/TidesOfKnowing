/** A member's preferred wall time, not a confirmed appointment or UTC conversion. */
export function sessionTimeDraft(wall: string, zone: string) {
  zone = zone.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wall)) throw Error('Choose a complete date and time.');
  const date = new Date(wall + ':00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,16) !== wall) throw Error('Choose a valid date and time.');
  try { new Intl.DateTimeFormat('en-US', {timeZone: zone}).format(date); }
  catch { throw Error('Enter a city time zone, such as Europe/London.'); }
  if (!zone) throw Error('Choose your time zone.');
  return `Preferred time: ${wall.slice(0,10)} at ${wall.slice(11)} (${zone}). This preference has not been sent or booked.`;
}
