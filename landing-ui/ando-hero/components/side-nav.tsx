import {
  imgIconBubble3,
  imgIconCalendar2,
  imgIconInboxEmpty,
  imgIconMagnifyingGlass2,
  imgIconUserAdd,
  imgLine133,
  imgLogoUnion,
  imgLogoUnionStroke,
} from '../assets/figma'

export function SideNav() {
  return (
    <div className="absolute content-stretch flex flex-col h-[717px] items-center justify-between left-0 overflow-clip p-[8px] top-[28px] w-[48px]">
      <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-[32px]">
        <div className="bg-white content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shadow-[0px_2px_8px_-2px_rgba(0,0,0,0.08)] shrink-0 size-[32px]">
          {/* logo - node 1810:2376 (20×20 frame) */}
          <div className="relative shrink-0 size-[20px]">
            <div className="absolute h-[15.577px] left-[2.57px] top-[3px] w-[14.86px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgLogoUnion}
              />
            </div>
            <div className="absolute h-[15.577px] left-[2.57px] top-[3px] w-[14.86px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgLogoUnionStroke}
              />
            </div>
          </div>
        </div>
        <div className="h-0 relative shrink-0 w-[16px]">
          <div className="absolute inset-[-1px_0_0_0]">
            <img
              alt=""
              className="block max-w-none size-full"
              src={imgLine133}
            />
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
          <div className="bg-[rgba(0,0,0,0.08)] content-stretch flex items-center justify-center overflow-clip relative rounded-[6px] shrink-0 size-[32px]">
            <div className="relative shrink-0 size-[16px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconBubble3}
              />
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shrink-0 size-[32px]">
            <div className="relative shrink-0 size-[16px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconInboxEmpty}
              />
            </div>
          </div>
          <div className="grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
            <div className="col-1 content-stretch flex flex-col items-center ml-0 mt-0 relative row-1 w-full">
              <div className="content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shrink-0 size-[32px]">
                <div className="relative shrink-0 size-[16px]">
                  <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src={imgIconCalendar2}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shrink-0 size-[32px]">
            <div className="relative shrink-0 size-[16px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconMagnifyingGlass2}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-start opacity-0 relative shrink-0">
        <div className="content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shrink-0 size-[32px]">
          <div className="relative shrink-0 size-[16px]">
            <img
              alt=""
              className="absolute block inset-0 max-w-none size-full"
              src={imgIconUserAdd}
            />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-center overflow-clip px-[12px] py-[4px] relative rounded-[6px] shrink-0 size-[32px]">
          <div className="bg-[rgba(0,0,0,0.18)] relative rounded-[999px] shrink-0 size-[16px]" />
        </div>
      </div>
    </div>
  )
}
