import Pusher from "pusher";

let instance: Pusher | null = null;
export function getPusherServer(): Pusher | null {
  const {
    PUSHER_APP_ID,
    PUSHER_SECRET,
    NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER,
  } = process.env;
  if (
    !PUSHER_APP_ID ||
    !PUSHER_SECRET ||
    !NEXT_PUBLIC_PUSHER_KEY ||
    !NEXT_PUBLIC_PUSHER_CLUSTER
  )
    return null;
  instance ??= new Pusher({
    appId: PUSHER_APP_ID,
    secret: PUSHER_SECRET,
    key: NEXT_PUBLIC_PUSHER_KEY,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });
  return instance;
}
