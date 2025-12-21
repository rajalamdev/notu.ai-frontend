import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconBell, IconChevronDown, IconMicrophone, IconSearch, IconVideo } from "@tabler/icons-react"
import { Input } from "./ui/input"

export function SiteHeader() {
  return (
    <header className="sticky top-0 py-8 flex h-(--header-height) bg-sidebar shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex justify-between w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex gap-2 items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Documents</h1>
        </div>
          {/* Center - Search and Upgrade */}
          <div className="flex items-center gap-4">
            {/* <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search for anything..." 
                className="w-80 pl-10 pr-4"
              />
            </div> */}
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">1</div>
              <span className="text-sm text-gray-600">Free meetings</span>
              <Button className="bg-green-500 hover:bg-green-600 text-white">Upgrade</Button>
            </div>
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            {/* Right - Actions and Profile */}
            <div className="flex items-center gap-4">
              <Button className="bg-[#6b4eff] hover:bg-[#5a3ee6] text-white">
                <IconVideo className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <IconMicrophone className="h-5 w-5 text-gray-600" />
            </div>
          </div>

      </div>
    </header>
  )
}
