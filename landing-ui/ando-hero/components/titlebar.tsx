function WindowControls({ className }: { className?: string }) {
  return (
    <div
      className={
        className ||
        'content-stretch flex gap-[7px] items-center p-[3px] relative'
      }
    >
      <div className="bg-[#ff736a] border-[0.5px] border-[rgba(0,0,0,0.1)] border-solid relative rounded-[100px] shrink-0 size-[10px]" />
      <div className="bg-[#febc2e] border-[0.5px] border-[rgba(0,0,0,0.1)] border-solid relative rounded-[100px] shrink-0 size-[10px]" />
      <div className="bg-[#19c332] border-[0.5px] border-[rgba(0,0,0,0.1)] border-solid relative rounded-[100px] shrink-0 size-[10px]" />
    </div>
  )
}

export function Titlebar() {
  return (
    <div className="h-[28px] overflow-clip relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full">
      <div className="-translate-x-1/2 -translate-y-1/2 [word-break:break-word] absolute flex flex-col font-titlebar font-bold justify-center leading-[0] left-[calc(50%+0.5px)] not-italic text-[rgba(0,0,0,0.76)] text-[13px] text-center top-[14px] tracking-[-0.052px] whitespace-nowrap">
        <p className="leading-[normal]">Ando</p>
      </div>
      <WindowControls className="absolute content-stretch flex gap-[7px] items-center left-[6px] p-[3px] top-[6px]" />
    </div>
  )
}
