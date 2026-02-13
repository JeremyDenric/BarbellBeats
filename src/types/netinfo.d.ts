declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: any;
  }

  export type NetInfoChangeHandler = (state: NetInfoState) => void;
  export type NetInfoSubscription = () => void;

  interface NetInfo {
    configure(configuration: Partial<any>): void;
    fetch(requestedInterface?: string): Promise<NetInfoState>;
    refresh(): Promise<NetInfoState>;
    addEventListener(listener: NetInfoChangeHandler): NetInfoSubscription;
    useNetInfo(configuration?: Partial<any>): NetInfoState;
  }

  const netInfo: NetInfo;
  export default netInfo;
}
