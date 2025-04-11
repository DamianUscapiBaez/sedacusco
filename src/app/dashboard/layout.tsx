import Header from "@/components/custom/header";
import PageWrapper from "@/components/custom/pagewrapper";
import Sidebar from "@/components/custom/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <Header />
            <PageWrapper>
                {children}
            </PageWrapper>
        </div>
    );
}