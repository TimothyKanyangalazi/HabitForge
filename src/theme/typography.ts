import { TextStyle } from "react-native";

export const typography: { [key: string]: TextStyle } = {
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    body: {
        fontSize: 16,
    },
    caption: {
        fontSize: 12,
        color: "#666",
    },
};