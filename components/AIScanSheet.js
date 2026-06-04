import React from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import SvgIcon from "./SvgIcon";

const PURPLE = "#535FFD";

// Shared button block — used inline inside any sheet step
export function AIScanButtons({ onCamera, onGallery }) {
  return (
    <View style={{ gap: 14 }}>
      <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={onCamera}>
        <SvgIcon name="camera" size={44} color="#FFFFFF" />
        <Text style={s.btnText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={onGallery}>
        <SvgIcon name="upload" size={44} color="#FFFFFF" />
        <Text style={s.btnText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
}

// Standalone modal sheet — used when there's no parent sheet to step inside
export default function AIScanSheet({ visible, onClose, onBack, mode }) {
  const navigation = useNavigation();

  const navigate = (source) => {
    onClose();
    const params = { source };
    if (mode) params.mode = mode;
    setTimeout(() => navigation.navigate("AITimetableScanner", params), 300);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.headerRow}>
            {onBack ? (
              <TouchableOpacity style={s.iconBtn} onPress={onBack}>
                <SvgIcon name="arrow-back" size={18} color="#111111" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.iconBtn} onPress={onClose}>
              <Text style={s.iconBtnX}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.title}>AI Scan</Text>
          <AIScanButtons
            onCamera={() => navigate("camera")}
            onGallery={() => navigate("gallery")}
          />
          <View style={{ height: 40 }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingTop: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0F0", justifyContent: "center", alignItems: "center" },
  iconBtnX: { color: "#111111", fontSize: 16, fontWeight: "500", lineHeight: 20 },
  title: { color: "#111111", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 20 },
  btn: { backgroundColor: PURPLE, borderRadius: 15, paddingVertical: 20, alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
