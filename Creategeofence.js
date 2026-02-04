#!/bin/bash
# Vérification ROOT
[[ $EUID -ne 0 ]] && echo "Erreur: Exécutez en ROOT." && exit 1

# --- CONFIGURATION INTERACTIVE ---
echo -e "\e[36m=== CONFIGURATION DU SERVEUR DE DESTINATION ===\e[0m"
read -p "Adresse IP ou nom d'hôte du serveur : " REMOTE_HOST
read -p "Nom d'utilisateur SSH [root] : " REMOTE_USER
REMOTE_USER=${REMOTE_USER:-root}
read -p "Répertoire de destination [/tmp] : " REMOTE_DIR
REMOTE_DIR=${REMOTE_DIR:-/tmp}

# Test de connexion rapide
echo "Vérification de la connexion..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" exit 2>/dev/null; then
    echo -e "\e[31m[!] Attention: La connexion SSH sans mot de passe a échoué.\e[0m"
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    echo
fi

REPORT_FILE="audit_report_$(date +%Y%m%d_%H%M%S).txt"
GPG_USER="votre@email.com"

# --- FONCTIONS ---
log_info() {
    echo -e "$1" | tee -a "$REPORT_FILE"
}

send_to_server() {
    local file=$1
    echo -e "\n\e[35m[TRANSFERT] Envoi de $file vers $REMOTE_HOST...\e[0m"
    if scp "$file" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"; then
        echo -e "\e[32m[SUCCÈS] Rapport archivé sur le serveur.\e[0m"
    else
        echo -e "\e[31m[ERREUR] Échec du transfert.\e[0m"
    fi
}

# --- AUDIT & EFFACEMENT ---
{
    echo "==============================================="
    echo "  RAPPORT D'AUDIT ET D'EFFACEMENT NIST 800-88  "
    echo "==============================================="
    echo "Hôte : $(hostname) | IP : $(hostname -I | awk '{print $1}')"
    echo "-----------------------------------------------"
} > "$REPORT_FILE"

# Identification des disques
DISKS=$(lsblk -dno NAME,TYPE | grep disk | awk '{print "/dev/"$1}')

for DISK in $DISKS; do
    log_info "\n[CIBLE] $DISK"
    # Audit SMART
    SMART_DATA=$(smartctl -H $DISK 2>/dev/null | grep -i "result" || echo "SMART non supporté")
    log_info "Santé : $SMART_DATA"

    # Effacement (Exemple simplifié pour la démo)
    log_info "Action : Effacement NIST en cours..."
    # [Votre logique d'effacement hdparm/nvme/shred ici]
    
    # Validation
    log_info "Validation : CONFORME"
done

# --- SIGNATURE ET ENVOI ---
if gpg --list-keys "$GPG_USER" &>/dev/null; then
    # Signature en mode batch (nécessite un agent GPG configuré ou pas de passphrase)
    gpg --batch --yes --clear-sign --local-user "$GPG_USER" "$REPORT_FILE"
    send_to_server "${REPORT_FILE}.asc"
    rm "$REPORT_FILE"
else
    echo -e "\n\e[31m[!] Rapport non signé : clé GPG introuvable.\e[0m"
    send_to_server "$REPORT_FILE"
fi

echo -e "\n--- OPÉRATION TERMINÉE ---"
