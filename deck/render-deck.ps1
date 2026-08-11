# Renders a .pptx to one PNG per slide, so the deck can actually be looked at.
#
# Geometry checks catch overlaps and overflow; they say nothing about whether a line breaks
# badly, a crop sits wrong against a heading, or a slide simply looks unbalanced. This exists
# so those can be seen rather than guessed at.
#
# Deliberately never calls Quit(): the user may have another deck open in the same PowerPoint
# instance, and quitting would close their window. Only the presentation opened here is closed.

param(
  [string]$File = "Aurora-Ops-Overview-new.pptx",
  [string]$Out  = "render",
  [int]$Width   = 1600
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$path = Join-Path $here $File
$dir  = Join-Path $here $Out

if (-not (Test-Path $path)) { Write-Error "No such deck: $path"; exit 1 }
if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
New-Item -ItemType Directory $dir | Out-Null

$app = New-Object -ComObject PowerPoint.Application
$openBefore = $app.Presentations.Count

# Open(FileName, ReadOnly, Untitled, WithWindow) — msoTrue is -1, msoFalse is 0.
$pres = $app.Presentations.Open($path, -1, 0, 0)
$pres.Export($dir, "PNG", $Width, [int]($Width * 7.5 / 13.333))
$pres.Close()

# Only close PowerPoint if it was not already running something of the user's.
if ($openBefore -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null

$files = Get-ChildItem $dir -Filter *.PNG | Sort-Object Name
"rendered {0} slides to {1}" -f $files.Count, $dir
