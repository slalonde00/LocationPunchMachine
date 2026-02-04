import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, Alert } from 'react-native';
import * as Network from 'expo-network';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import axios from 'axios';

// --- CONFIGURATION ---
const WIFI_TASK_NAME = 'WIFI_PUNCH_TASK';
const OFFICE_SSID = 'WIFI_BUREAU_NOM'; // Mettez le nom de votre Wifi
const SERVER_URL = 'http://192.168.1.50'; // IP de votre serveur
const USER_ID = 'Employe_01';

// --- 1. DÉFINITION DE LA TÂCHE DE FOND ---
TaskManager.defineTask(WIFI_TASK_NAME, async () => {
  try {
    const state = await Network.getNetworkStateAsync();
    // Sur Android/iOS, le SSID nécessite souvent les permissions de localisation
    // On vérifie si on est sur le Wi-Fi
    const isAtOffice = state.type === Network.NetworkType.WIFI; 
    
    await axios.post(SERVER_URL, {
      userId: USER_ID,
      action: isAtOffice ? 'ENTER' : 'EXIT'
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// --- 2. COMPOSANT PRINCIPAL ---
export default function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState('Désactivé');

  const toggleSwitch = async () => {
    if (!isEnabled) {
      // Demander les permissions indispensables
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

      if (locStatus !== 'granted' || bgStatus !== 'granted') {
        Alert.alert("Erreur", "L'accès à la localisation 'Toujours' est requis pour détecter le Wi-Fi en arrière-plan.");
        return;
      }

      // Activer la tâche de fond (toutes les 15 min - limite OS)
      await BackgroundFetch.registerTaskAsync(WIFI_TASK_NAME, {
        minimumInterval: 15 * 60, 
        stopOnTerminate: false,
        startOnBoot: true,
      });
      setStatus('Surveillance active');
    } else {
      await BackgroundFetch.unregisterTaskAsync(WIFI_TASK_NAME);
      setStatus('Désactivé');
    }
    setIsEnabled(previousState => !previousState);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pointeuse Automatique</Text>
      <View style={styles.card}>
        <Text style={styles.statusLabel}>Statut : {status}</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>
      <Text style={styles.info}>
        L'application vous pointera automatiquement en arrivant sur le réseau : {OFFICE_SSID}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between', elevation: 3 },
  statusLabel: { fontSize: 18 },
  info: { marginTop: 20, color: '#666', textAlign: 'center' }
});
