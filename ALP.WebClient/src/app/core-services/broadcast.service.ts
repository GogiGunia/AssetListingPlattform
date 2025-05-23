import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  public loginChannel = new TypedBroadcastChannel<LoginChannelMessage>("loginChannel");
  public logoutChannel = new TypedBroadcastChannel<boolean>("logoutChannel");
  public refreshChannel = new TypedBroadcastChannel<string>("refreshChannel");
}

interface BroadcastChannelEventMap<T> {
  message: MessageEvent<T>
  messageerror: MessageEvent
}

class TypedBroadcastChannel<T> extends BroadcastChannel {
  public override postMessage(message: T): void {
    return super.postMessage(message);
  }
  public override onmessage:
    | ((this: BroadcastChannel, ev: BroadcastChannelEventMap<T>['message']) => void)
    | null = null;

  public override addEventListener<K extends keyof BroadcastChannelEventMap<T>>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap<T>[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    return super.addEventListener(type, listener, options);
  }
}

interface LoginChannelMessage {
  accessToken: string;
  refreshToken: string;
}
