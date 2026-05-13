Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "concept-04-andes-studio.png"
$bmp = New-Object System.Drawing.Bitmap(1800, 1600)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function B($hex) { New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function P($hex, $w = 1) { New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $w) }
function T($text, $font, $brush, $x, $y, $w, $h) {
  $r = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $f = New-Object System.Drawing.StringFormat
  $f.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $g.DrawString($text, $font, $brush, $r, $f)
}

$font = "Segoe UI"
$h1 = New-Object System.Drawing.Font($font, 40, [System.Drawing.FontStyle]::Bold)
$h2 = New-Object System.Drawing.Font($font, 22, [System.Drawing.FontStyle]::Bold)
$h3 = New-Object System.Drawing.Font($font, 16, [System.Drawing.FontStyle]::Bold)
$body = New-Object System.Drawing.Font($font, 13)
$small = New-Object System.Drawing.Font($font, 10, [System.Drawing.FontStyle]::Bold)
$big = New-Object System.Drawing.Font($font, 28, [System.Drawing.FontStyle]::Bold)

$page = B "#f4f1ea"
$surface = B "#fffdf8"
$subtle = B "#fbf7f0"
$ink = B "#1d302d"
$muted = B "#68746f"
$deep = B "#1d302d"
$accent = B "#c47636"
$soft = B "#efe3d2"
$line = P "#ded5c6"
$white = B "#fffaf2"

$g.FillRectangle($page, 0, 0, 1800, 1600)
T "Concept 04 - Andes Studio" $h1 $ink 48 44 800 56
T "An original HR command workspace: compact left rail, warm editorial surfaces, contextual headers, and three focused product pages." $body $muted 50 105 900 52

$colors = @("#28564f", "#c47636", "#f4f1ea", "#1d302d", "#fffdf8")
for ($i = 0; $i -lt $colors.Count; $i++) {
  $b = B $colors[$i]
  $g.FillRectangle($b, 1430 + ($i * 54), 58, 42, 42)
  $g.DrawRectangle((P "#d1c7b8"), 1430 + ($i * 54), 58, 42, 42)
}

function DrawRail($x, $y, $active) {
  $g.FillRectangle($deep, $x, $y, 76, 1200)
  $g.FillRectangle($accent, $x + 14, $y + 18, 48, 48)
  T "AH" $h3 $white ($x + 23) ($y + 29) 34 26
  $items = @("DB", "PE", "LV", "DC", "RP", "ST")
  for ($i = 0; $i -lt $items.Count; $i++) {
    $iy = $y + 96 + ($i * 60)
    if ($items[$i] -eq $active) {
      $g.FillRectangle($white, $x + 14, $iy, 48, 48)
      T $items[$i] $small $deep ($x + 27) ($iy + 16) 24 18
    } else {
      T $items[$i] $small $white ($x + 27) ($iy + 16) 24 18
    }
  }
}

function DrawMetric($x, $y, $label, $value) {
  $g.FillRectangle($surface, $x, $y, 214, 92)
  $g.DrawRectangle($line, $x, $y, 214, 92)
  T $label $small $muted ($x + 14) ($y + 12) 170 20
  T $value $big $ink ($x + 14) ($y + 38) 140 42
}

function DrawScreen($x, $title, $subtitle, $active, $kind) {
  $y = 180
  $w = 540
  $h = 1220
  $g.FillRectangle($surface, $x, $y, $w, $h)
  $g.DrawRectangle($line, $x, $y, $w, $h)
  DrawRail $x $y $active
  $mx = $x + 76
  $g.FillRectangle($surface, $mx, $y, $w - 76, 86)
  $g.DrawLine($line, $mx, $y + 86, $x + $w, $y + 86)
  T $title $h2 $ink ($mx + 24) ($y + 18) 260 32
  T $subtitle $body $muted ($mx + 24) ($y + 51) 300 22
  $g.FillRectangle($subtle, $mx, $y + 86, $w - 76, $h - 86)
  $cx = $mx + 24
  $cy = $y + 112

  if ($kind -eq "dashboard") {
    $g.FillRectangle((B "#28564f"), $cx, $cy, 416, 122)
    T "Today in People Ops" $h2 $white ($cx + 18) ($cy + 18) 300 34
    T "Prioritized work queue for approvals, document gaps, onboarding blockers, and hiring movement." $body $white ($cx + 18) ($cy + 58) 360 48
    DrawMetric $cx ($cy + 142) "Active employees" "284"
    DrawMetric ($cx + 226) ($cy + 142) "Pending approvals" "18"
    DrawMetric $cx ($cy + 248) "Missing docs" "31"
    DrawMetric ($cx + 226) ($cy + 248) "Open roles" "7"
    $g.FillRectangle($surface, $cx, $cy + 374, 416, 260)
    $g.DrawRectangle($line, $cx, $cy + 374, 416, 260)
    T "Priority queue" $h3 $ink ($cx + 16) ($cy + 390) 180 26
    $rows = @("Approve Lucia's PTO request", "Collect Natalia's contract addendum", "Assign IT setup for two new hires")
    for ($i = 0; $i -lt $rows.Count; $i++) {
      $ry = $cy + 434 + ($i * 58)
      $g.FillEllipse($accent, $cx + 18, $ry + 14, 12, 12)
      T $rows[$i] $body $ink ($cx + 42) $ry 250 30
      $g.FillRectangle($soft, $cx + 310, $ry + 4, 70, 28)
    }
  } elseif ($kind -eq "profile") {
    $g.FillRectangle($surface, $cx, $cy, 416, 108)
    $g.DrawRectangle($line, $cx, $cy, 416, 108)
    $g.FillRectangle((B "#28564f"), $cx + 16, $cy + 18, 72, 72)
    T "MR" $h2 $white ($cx + 31) ($cy + 36) 40 32
    T "Mariela Rojas" $h2 $ink ($cx + 104) ($cy + 22) 220 32
    T "HR Manager - Cochabamba - Full-time" $body $muted ($cx + 104) ($cy + 58) 260 24
    $labels = @("Work email", "Phone", "Department", "Location", "Start date", "Client project")
    for ($i = 0; $i -lt 6; $i++) {
      $fx = $cx + (($i % 2) * 214)
      $fy = $cy + 140 + ([math]::Floor($i / 2) * 78)
      $g.FillRectangle($surface, $fx, $fy, 202, 62)
      $g.DrawRectangle($line, $fx, $fy, 202, 62)
      T $labels[$i] $small $muted ($fx + 12) ($fy + 9) 160 18
      T "Sample value" $body $ink ($fx + 12) ($fy + 31) 160 24
    }
    $g.FillRectangle($surface, $cx, $cy + 400, 416, 250)
    $g.DrawRectangle($line, $cx, $cy + 400, 416, 250)
    T "Employment timeline" $h3 $ink ($cx + 16) ($cy + 418) 220 26
    T "Promoted to HR Manager" $body $ink ($cx + 36) ($cy + 464) 220 26
    T "Moved to People Ops" $body $ink ($cx + 36) ($cy + 512) 220 26
    T "Joined as HR Generalist" $body $ink ($cx + 36) ($cy + 560) 220 26
  } else {
    $g.FillRectangle((B "#28564f"), $cx, $cy, 416, 112)
    T "Vacation balance: 12.5 days" $h2 $white ($cx + 18) ($cy + 18) 320 34
    T "This request goes to Carlos Vega. HR can override after manager review." $body $white ($cx + 18) ($cy + 58) 350 42
    $fields = @("Leave type: Vacation", "Start date: June 10, 2026", "End date: June 14, 2026", "Duration: 5 working days", "Reason: Family trip with coverage assigned")
    for ($i = 0; $i -lt $fields.Count; $i++) {
      $fy = $cy + 136 + ($i * 76)
      $g.FillRectangle($surface, $cx, $fy, 416, 58)
      $g.DrawRectangle($line, $cx, $fy, 416, 58)
      $parts = $fields[$i].Split(":")
      T $parts[0] $small $muted ($cx + 14) ($fy + 8) 150 18
      T $parts[1].Trim() $body $ink ($cx + 14) ($fy + 30) 340 22
    }
    $g.FillRectangle($soft, $cx, $cy + 540, 416, 58)
    T "Projected balance after approval: 7.5 vacation days." $body $accent ($cx + 14) ($cy + 558) 360 24
    $g.FillRectangle($accent, $cx + 242, $cy + 622, 174, 44)
    T "Submit request" $h3 $white ($cx + 270) ($cy + 631) 130 24
  }
}

DrawScreen 48 "Dashboard" "Globex Bolivia - HR command center" "DB" "dashboard"
DrawScreen 630 "Employee Profile" "Permission-aware employee record" "PE" "profile"
DrawScreen 1212 "Leave Request" "Employee self-service approval" "LV" "leave"

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
