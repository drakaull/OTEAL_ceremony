import { ParticipantExperience } from "../components/ParticipantExperience";
import { AdminControlPanel } from "../components/AdminControlPanel";

export function AdminControl() {
  return (
    <div className="screen">
      <ParticipantExperience />
      <AdminControlPanel />
    </div>
  );
}
