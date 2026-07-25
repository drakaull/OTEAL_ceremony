import { Outlet } from "react-router-dom";
import { NavMenu } from "./NavMenu";

export function LayoutWithNav() {
  return (
    <>
      <NavMenu />
      <Outlet />
    </>
  );
}
