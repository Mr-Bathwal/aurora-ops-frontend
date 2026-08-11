# Measures the text PowerPoint actually laid out, not the boxes the build script declared.
#
# check-deck.mjs reads the declared rectangles from the file, which is why a box declared 0.4"
# tall but wrapping to two lines passed as "in bounds" and then spilled off the slide. Only the
# renderer knows the real height, so ask it: TextRange.BoundHeight is what was actually drawn.
#
# Flags two things per shape: text taller than the box holding it, and text crossing the bottom
# edge of the slide.

param([string]$File = "Aurora-Ops-Overview.pptx")

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$path = Join-Path $here $File
if (-not (Test-Path $path)) { Write-Error "No such deck: $path"; exit 1 }

$app = New-Object -ComObject PowerPoint.Application
$openBefore = $app.Presentations.Count
$pres = $app.Presentations.Open($path, -1, 0, 0)

$slideH = $pres.PageSetup.SlideHeight   # points
$problems = 0

foreach ($slide in $pres.Slides) {
  foreach ($shape in $slide.Shapes) {
    if (-not $shape.HasTextFrame) { continue }
    if ($shape.TextFrame.HasText -eq 0) { continue }

    $tr   = $shape.TextFrame.TextRange
    $need = $tr.BoundHeight
    $have = $shape.Height
    $txt  = ($tr.Text -replace "\s+", " ")
    if ($txt.Length -gt 34) { $txt = $txt.Substring(0, 34) }

    if ($need -gt $have + 1.5) {
      $problems++
      "  slide {0,2} TEXT TALLER THAN ITS BOX  needs {1:N0}pt, has {2:N0}pt  - `"{3}`"" -f $slide.SlideIndex, $need, $have, $txt
    }
    if ($shape.Top + $need -gt $slideH + 1.5) {
      $problems++
      "  slide {0,2} TEXT RUNS OFF THE SLIDE   by {1:N0}pt  - `"{2}`"" -f $slide.SlideIndex, ($shape.Top + $need - $slideH), $txt
    }
  }
}

$pres.Close()
if ($openBefore -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null

if ($problems -eq 0) { "`nlaid-out text: clean" } else { "`n{0} laid-out text problems" -f $problems }
