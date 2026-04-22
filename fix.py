import sys

path = "frontend/app/network/page.js"
with open(path, "r") as f:
    text = f.read()

# Lines / elements
text = text.replace('strokeWidth="0.3"', 'strokeWidth="1.2"')
text = text.replace('r="0.6"', 'r="2.5"')

# Node shapes
text = text.replace("const nodeSize = isSubDevice ? 'p-1.5' : 'p-2';", "const nodeSize = isSubDevice ? 'w-14 h-14' : 'w-20 h-20';")
text = text.replace("typeLabel = isEsp32 ? 'E' : isRaspberry ? 'R' : isSubDevice ? (device.type || 'U').charAt(0) : (device.type || 'U').charAt(0);", "typeLabel = isEsp32 ? 'E' : isRaspberry ? 'R' : isSubDevice ? (device.type || 'U').charAt(0).upper() : (device.type || 'U').charAt(0).upper();")

# Text sizing inside node
text = text.replace("text-[10px] font-black ${isSubDevice ? 'text-[8px]' : ''} text-white", "text-3xl font-black ${isSubDevice ? 'text-xl' : ''} text-white/90 drop-shadow-md")

# Border and rounding
text = text.replace("rounded-md border", "rounded-2xl border-[3px]")
text = text.replace("border border-rose-500/80 animate-ping rounded-md", "border-[3px] border-rose-500/80 animate-ping rounded-2xl")

# Dot indicator
text = text.replace("w-2 h-2 rounded-full", "w-4 h-4 rounded-full -top-2 -right-2")

# Offline text
text = text.replace("text-[8px] font-mono text-white/50", "text-sm font-mono text-white/90 font-bold rounded-2xl")

# Text block
text = text.replace("text-[7px]' : 'text-[8px]'} font-mono text-white/80", "text-xs' : 'text-sm'} font-mono text-white tracking-wide font-bold")
text = text.replace("px-2 py-0.5 rounded border border-white/5", "px-4 py-2 rounded-xl border border-white/20 shadow-lg")
text = text.replace("text-[7px] font-mono", "text-[11px] font-mono font-bold")


with open(path, "w") as f:
    f.write(text)

print("Patch applied")