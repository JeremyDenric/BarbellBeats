import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

let configured = false;

export function configureOnlineManager() {
  if (configured) {
    return;
  }

  configured = true;
  if (Platform.OS !== "web") {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const isOnline =
          !!state.isConnected && state.isInternetReachable !== false;
        setOnline(isOnline);
      });
    });
  }
}

export default configureOnlineManager;
