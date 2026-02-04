import * as Network from 'expo-network';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import axios from 'axios';

const WIFI_TASK_NAME = 'WIFI_CHECK_TASK';
const OFFICE_WIFI_NAME = '"Mon_Wifi_Bureau"'; // Remplacez par votre SSID exact
const SERVER_URL = 'http://192.168.1.50';

// 1. Tâche de fond qui vérifie le Wi-Fi périodiquement
TaskManager.defineTask(WIFI_TASK_NAME, async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    // Vérification du nom du réseau (SSID exige souvent la permission de localisation sur Android/iOS)
    // Note: Sur les versions récentes, SSID n'est accessible que si le GPS est activé
    const isConnectedToOffice = networkState.isConnected && networkState.type === Network.NetworkType.WIFI;

    // Logique simplifiée : Si connecté au Wi-Fi = CHECK-IN
    if (isConnectedToOffice) {
      await axios.post(SERVER_URL, { userId: "Employe_01", action: "ENTER" });
    } else {
      await axios.post(SERVER_URL, { userId: "Employe_01", action: "EXIT" });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Configuration du déclencheur (toutes les 15 minutes par exemple)
async function registerWifiTask() {
  return BackgroundFetch.registerTaskAsync(WIFI_TASK_NAME, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
