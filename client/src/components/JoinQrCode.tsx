import { QRCodeSVG } from "qrcode.react";

export function JoinQrCode() {
  const joinUrl = `${window.location.origin}/play`;

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 16, display: "inline-block" }}>
      <QRCodeSVG value={joinUrl} size={220} />
    </div>
  );
}
