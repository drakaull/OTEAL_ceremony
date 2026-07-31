import { QRCodeSVG } from "qrcode.react";

export function JoinQrCode() {
  const joinUrl = `${window.location.origin}/play`;

  return (
    <div className="qr-frame">
      <QRCodeSVG value={joinUrl} size={340} fgColor="#1a1408" />
    </div>
  );
}
