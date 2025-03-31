import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
	title: "Air Force Assignment Simulator",
	description: "Assignment problem simulator",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
