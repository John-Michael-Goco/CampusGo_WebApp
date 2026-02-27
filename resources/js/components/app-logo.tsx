export default function AppLogo() {
    return (
        <>
            <img
                src="/images/logo.png"
                alt="CampusGo"
                className="h-9 w-auto shrink-0 object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:min-w-8"
            />
            <span className="ml-2 truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
                CampusGo
            </span>
        </>
    );
}
