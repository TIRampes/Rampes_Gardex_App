import { ReactNode } from "react";
import DashboardLayout from "../components/Layout/Dashboardlayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}