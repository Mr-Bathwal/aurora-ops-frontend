# Adds slide transitions and build animations.
#
# pptxgenjs cannot do either — it has no animation or transition API at all, which is why this
# exists as a separate pass over the finished file. PowerPoint's own object model can, so the
# deck is built first and animated second.
#
# Restraint is the whole design here. Two rules:
#   1. Every slide gets the same quiet transition. A deck where each slide arrives differently
#      looks like a template demo, not a piece of work.
#   2. Only flow diagrams animate, and only so the presenter can talk through one step at a
#      time. Nothing else moves — text that flies in is the fastest way to look amateur.
#
# Shapes are selected by geometry rather than by name, because pptxgenjs does not name them.
# Each rule says: on this slide, take shapes whose top edge falls in this band, order them
# left-to-right (or top-to-bottom), and reveal them one click at a time.

param([string]$File = "Aurora-Ops-Overview.pptx")

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$path = Join-Path $here $File
if (-not (Test-Path $path)) { Write-Error "No such deck: $path"; exit 1 }

# PowerPoint measures in points; the build script thinks in inches.
function Inch([double]$i) { return $i * 72 }

$ppEffectFade          = 1793
$msoAnimEffectFade     = 10
$msoAnimTriggerOnClick = 1
$msoAnimTriggerAfter   = 3

# slide index -> band of shape tops to reveal in sequence, and the axis to order them on.
$rules = @{
   2 = @{ From = 2.55; To = 2.70; Axis = 'L' }   # detect / diagnose / act
   3 = @{ From = 2.55; To = 2.70; Axis = 'L' }   # the four-step chain
  # Only the right panel's chain. The first pass took the whole band and produced 25 reveals
  # on one slide — nobody clicks 25 times to explain a four-step diagram.
   6 = @{ From = 3.15; To = 5.85; Axis = 'T'; LeftFrom = 6.9 }
   8 = @{ From = 2.70; To = 4.65; Axis = 'T'; LeftFrom = 5.0; LeftTo = 8.5 }   # the three hops
  11 = @{ From = 2.10; To = 2.25; Axis = 'L' }   # the five-box data flow
}

$app = New-Object -ComObject PowerPoint.Application
$openBefore = $app.Presentations.Count
$pres = $app.Presentations.Open($path, 0, 0, 0)     # writable, no window
if ($null -eq $pres) { Write-Error "Could not open $path"; exit 2 }

$transitioned = 0
$animated = 0
$clicks = @{}

foreach ($slide in $pres.Slides) {
  # Same transition everywhere, deliberately.
  $slide.SlideShowTransition.EntryEffect = $ppEffectFade
  $slide.SlideShowTransition.Duration = 0.5
  $slide.SlideShowTransition.AdvanceOnClick = -1
  $transitioned++

  # Re-running must not pile a second set of effects on top of the first.
  while ($slide.TimeLine.MainSequence.Count -gt 0) { $slide.TimeLine.MainSequence.Item(1).Delete() }

  $rule = $rules[[int]$slide.SlideIndex]
  if ($null -eq $rule) { continue }

  $lo = Inch $rule.From
  $hi = Inch $rule.To

  $leftMin = if ($null -ne $rule.LeftFrom) { Inch $rule.LeftFrom } else { -1 }
  $leftMax = if ($null -ne $rule.LeftTo)   { Inch $rule.LeftTo }   else { 99999 }

  # Connectors are skipped. An arrow that fades in separately from the box it points at reads
  # as a glitch, and it doubles the click count for no benefit — they simply stay on screen.
  $targets = @()
  foreach ($shape in $slide.Shapes) {
    if ($shape.Height -lt 4 -or $shape.Width -lt 4) { continue }
    if ($shape.Top -ge $lo -and $shape.Top -le $hi -and $shape.Left -ge $leftMin -and $shape.Left -le $leftMax) { $targets += $shape }
  }
  if ($rule.Axis -eq 'L') { $targets = $targets | Sort-Object Left }
  else                    { $targets = $targets | Sort-Object Top, Left }

  # Group shapes sharing a position so a box and its label arrive together, not separately.
  $lastKey = $null
  foreach ($shape in $targets) {
    $key = if ($rule.Axis -eq 'L') { [math]::Round($shape.Left / 24) } else { [math]::Round($shape.Top / 24) }
    $trigger = if ($key -eq $lastKey) { $msoAnimTriggerAfter } else { $msoAnimTriggerOnClick }
    $effect = $slide.TimeLine.MainSequence.AddEffect($shape, $msoAnimEffectFade, 0, $trigger)
    $effect.Timing.Duration = 0.35
    if ($trigger -eq $msoAnimTriggerOnClick) { $clicks[[int]$slide.SlideIndex] = 1 + [int]$clicks[[int]$slide.SlideIndex] }
    $lastKey = $key
    $animated++
  }
}

$pres.Save()
$pres.Close()
if ($openBefore -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null

"transitions applied : {0} slides" -f $transitioned
"build animations    : {0} shapes across {1} slides" -f $animated, $rules.Count
"clicks to advance   : {0}" -f (($clicks.GetEnumerator() | Sort-Object Name | ForEach-Object { "s$($_.Name)=$($_.Value)" }) -join "  ")
