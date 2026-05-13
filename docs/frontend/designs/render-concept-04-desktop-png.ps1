Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot "concept-04-andes-studio-desktop.png"
$bmp = New-Object System.Drawing.Bitmap(1800, 2850)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function B($hex) { New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function P($hex, $w = 1) { New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $w) }
function T($text, $font, $brush, $x, $y, $w, $h) {
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $g.DrawString($text, $font, $brush, $rect, $fmt)
}

$font = "Segoe UI"
$h1 = New-Object System.Drawing.Font($font, 40, [System.Drawing.FontStyle]::Bold)
$h2 = New-Object System.Drawing.Font($font, 24, [System.Drawing.FontStyle]::Bold)
$h3 = New-Object System.Drawing.Font($font, 17, [System.Drawing.FontStyle]::Bold)
$body = New-Object System.Drawing.Font($font, 13)
$small = New-Object System.Drawing.Font($font, 10, [System.Drawing.FontStyle]::Bold)
$big = New-Object System.Drawing.Font($font, 30, [System.Drawing.FontStyle]::Bold)

$page = B "#f6f8fb"
$surface = B "#ffffff"
$subtle = B "#f6f8fb"
$ink = B "#172033"
$muted = B "#627086"
$deep = B "#172033"
$accent = B "#2f7d48"
$soft = B "#dff1e4"
$hero = B "#185f59"
$line = P "#d8e0ea"
$white = B "#ffffff"

$g.FillRectangle($page, 0, 0, 1800, 2850)
T "Concept 04 - Andes Studio Desktop" $h1 $ink 48 44 900 58
T "Wide monitor screens: command rail, section navigation, contextual header, and spacious desktop work areas." $body $muted 50 106 950 46

$colors = @("#185f59", "#2f7d48", "#172033", "#f6f8fb", "#ffffff")
for ($i = 0; $i -lt $colors.Count; $i++) {
  $brush = B $colors[$i]
  $g.FillRectangle($brush, 1430 + ($i * 54), 58, 42, 42)
  $g.DrawRectangle((P "#d1c7b8"), 1430 + ($i * 54), 58, 42, 42)
}

function Draw-Rail($x, $y, $active) {
  $g.FillRectangle($deep, $x, $y, 188, 820)
  $g.FillRectangle($accent, $x + 16, $y + 22, 60, 60)
  T "AH" $h3 $white ($x + 31) ($y + 39) 36 24
  $items = @(
    @("DB", "Dashboard"),
    @("PE", "People"),
    @("LV", "Leave"),
    @("DC", "Documents"),
    @("RP", "Reports"),
    @("ST", "Settings")
  )
  for ($i = 0; $i -lt $items.Count; $i++) {
    $iy = $y + 118 + ($i * 64)
    if ($items[$i][0] -eq $active) {
      $g.FillRectangle($white, $x + 14, $iy, 160, 52)
      $g.DrawRectangle((P "#d8e0ea"), $x + 26, $iy + 11, 30, 30)
      T $items[$i][0] $small $deep ($x + 33) ($iy + 18) 24 18
      T $items[$i][1] $body $deep ($x + 66) ($iy + 16) 108 22
    } else {
      $g.DrawRectangle((P "#3a4558"), $x + 26, $iy + 11, 30, 30)
      T $items[$i][0] $small $white ($x + 33) ($iy + 18) 24 18
      T $items[$i][1] $body $white ($x + 66) ($iy + 16) 108 22
    }
  }
}

function Draw-SectionNav($x, $y, $title, $items, $active) {
  $g.FillRectangle((B "#f3f7f6"), $x, $y, 260, 820)
  $g.DrawLine($line, $x + 260, $y, $x + 260, $y + 820)
  $g.FillRectangle($surface, $x + 20, $y + 24, 44, 44)
  $g.DrawRectangle($line, $x + 20, $y + 24, 44, 44)
  T "GC" $small $accent ($x + 31) ($y + 37) 28 18
  T "Globex Co." $small $ink ($x + 76) ($y + 25) 120 18
  T "Bolivia Operations" $small $muted ($x + 76) ($y + 45) 140 18
  $g.DrawLine($line, $x + 20, $y + 86, $x + 230, $y + 86)
  T $title $h3 $ink ($x + 20) ($y + 112) 210 28
  T "Workspace navigation and filters." $body $muted ($x + 20) ($y + 146) 210 46
  for ($i = 0; $i -lt $items.Count; $i++) {
    $iy = $y + 218 + ($i * 48)
    if ($items[$i] -eq $active) {
      $g.FillRectangle($soft, $x + 20, $iy, 210, 38)
      T $items[$i] $body $accent ($x + 32) ($iy + 8) 160 22
    } else {
      T $items[$i] $body $muted ($x + 32) ($iy + 8) 160 22
    }
  }
}

function Draw-Metric($x, $y, $label, $value) {
  $g.FillRectangle($surface, $x, $y, 210, 92)
  $g.DrawRectangle($line, $x, $y, 210, 92)
  T $label $small $muted ($x + 14) ($y + 12) 170 18
  T $value $big $ink ($x + 14) ($y + 36) 120 44
}

function Draw-Top($x, $y, $title, $subtitle, $button) {
  $g.FillRectangle($surface, $x, $y, 1256, 86)
  $g.DrawLine($line, $x, $y + 86, $x + 1256, $y + 86)
  T $title $h2 $ink ($x + 28) ($y + 17) 430 34
  T $subtitle $body $muted ($x + 28) ($y + 52) 520 22
  $g.FillRectangle((B "#f6f8fb"), $x + 758, $y + 22, 260, 42)
  $g.DrawRectangle($line, $x + 758, $y + 22, 260, 42)
  T "Search..." $body $muted ($x + 774) ($y + 32) 130 22
  $g.FillRectangle($accent, $x + 1038, $y + 22, 150, 42)
  T $button $small $white ($x + 1062) ($y + 34) 110 18
}

function Draw-Monitor($y, $active, $section, $topTitle, $subtitle, $kind) {
  $x = 48
  $w = 1704
  $h = 820
  $g.FillRectangle($surface, $x, $y, $w, $h)
  $g.DrawRectangle($line, $x, $y, $w, $h)
  Draw-Rail $x $y $active
  Draw-SectionNav ($x + 188) $y $section @("Today", "Approvals", "Documents", "Onboarding", "Reports") "Today"
  $mx = $x + 448
  Draw-Top $mx $y $topTitle $subtitle "Primary"
  $cx = $mx + 28
  $cy = $y + 112
  $g.FillRectangle($subtle, $mx, $y + 86, 1256, 734)

  if ($kind -eq "dashboard") {
    $g.FillRectangle($hero, $cx, $cy, 1200, 112)
    T "Work that needs attention" $h2 $white ($cx + 24) ($cy + 20) 430 34
    T "Prioritized work queue for approvals, document gaps, onboarding blockers, and recruiting movement." $body $white ($cx + 24) ($cy + 60) 760 30
    Draw-Metric $cx ($cy + 136) "Employees" "284"
    Draw-Metric ($cx + 224) ($cy + 136) "Approvals" "18"
    Draw-Metric ($cx + 448) ($cy + 136) "Missing docs" "31"
    Draw-Metric ($cx + 672) ($cy + 136) "Open roles" "7"
    $g.FillRectangle($surface, $cx, $cy + 254, 760, 290)
    $g.DrawRectangle($line, $cx, $cy + 254, 760, 290)
    T "Priority queue" $h3 $ink ($cx + 18) ($cy + 272) 220 30
    $rows = @("Approve Lucia's PTO request", "Collect Natalia's contract addendum", "Assign IT setup for two new hires")
    for ($i = 0; $i -lt $rows.Count; $i++) {
      $ry = $cy + 326 + ($i * 62)
      $g.FillEllipse($accent, $cx + 22, $ry + 16, 12, 12)
      T $rows[$i] $body $ink ($cx + 46) $ry 420 32
      $g.FillRectangle($soft, $cx + 600, $ry + 4, 92, 30)
    }
    $g.FillRectangle($surface, $cx + 784, $cy + 254, 416, 290)
    $g.DrawRectangle($line, $cx + 784, $cy + 254, 416, 290)
    T "Headcount by department" $h3 $ink ($cx + 804) ($cy + 272) 280 30
    T "Engineering        128`nOperations          74`nPeople Ops          18`nFinance             12" $body $muted ($cx + 804) ($cy + 322) 300 150
  } elseif ($kind -eq "profile") {
    $g.FillRectangle($surface, $cx, $cy, 330, 250)
    $g.DrawRectangle($line, $cx, $cy, 330, 250)
    $g.FillRectangle($hero, $cx + 20, $cy + 20, 96, 96)
    T "MR" $big $white ($cx + 43) ($cy + 48) 50 42
    T "Mariela Rojas" $h2 $ink ($cx + 20) ($cy + 136) 250 34
    T "HR Manager - Cochabamba - Full-time" $body $muted ($cx + 20) ($cy + 172) 260 46
    $labels = @("Work email", "Phone", "Start date", "Department", "Location", "Client project")
    for ($i = 0; $i -lt 6; $i++) {
      $fx = $cx + 360 + (($i % 3) * 306)
      $fy = $cy + ([math]::Floor($i / 3) * 88)
      $g.FillRectangle($surface, $fx, $fy, 286, 72)
      $g.DrawRectangle($line, $fx, $fy, 286, 72)
      T $labels[$i] $small $muted ($fx + 14) ($fy + 12) 150 18
      T "Sample value" $body $ink ($fx + 14) ($fy + 38) 190 24
    }
    $g.FillRectangle($surface, $cx + 360, $cy + 206, 898, 300)
    $g.DrawRectangle($line, $cx + 360, $cy + 206, 898, 300)
    T "Employment timeline" $h3 $ink ($cx + 382) ($cy + 228) 260 30
    T "May 1, 2024       Promoted to HR Manager        Ana Salinas`nMar 15, 2022      Moved to People Ops          Carlos Vega`nAug 8, 2021       Joined as HR Generalist      System" $body $ink ($cx + 382) ($cy + 284) 760 120
  } else {
    $g.FillRectangle($hero, $cx, $cy, 810, 112)
    T "Vacation balance: 12.5 days" $h2 $white ($cx + 24) ($cy + 20) 430 34
    T "This request will go to Carlos Vega. HR can override after manager review." $body $white ($cx + 24) ($cy + 60) 620 30
    $fields = @("Leave type: Vacation", "Duration: 5 working days", "Start date: June 10, 2026", "End date: June 14, 2026", "Reason: Family trip. Coverage assigned to Lucia Choque.")
    for ($i = 0; $i -lt $fields.Count; $i++) {
      $fx = $cx + (($i % 2) * 398)
      $fy = $cy + 138 + ([math]::Floor($i / 2) * 84)
      $fw = if ($i -eq 4) { 780 } else { 374 }
      $g.FillRectangle($surface, $fx, $fy, $fw, 68)
      $g.DrawRectangle($line, $fx, $fy, $fw, 68)
      $parts = $fields[$i].Split(":")
      T $parts[0] $small $muted ($fx + 14) ($fy + 12) 120 18
      T $parts[1].Trim() $body $ink ($fx + 14) ($fy + 38) ($fw - 28) 22
    }
    $g.FillRectangle($surface, $cx + 842, $cy, 420, 408)
    $g.DrawRectangle($line, $cx + 842, $cy, 420, 408)
    T "June calendar" $h3 $ink ($cx + 864) ($cy + 18) 220 28
    for ($i = 0; $i -lt 14; $i++) {
      $dx = $cx + 864 + (($i % 7) * 52)
      $dy = $cy + 66 + ([math]::Floor($i / 7) * 58)
      if ($i -ge 9) { $g.FillRectangle($soft, $dx, $dy, 44, 44) } else { $g.FillRectangle($surface, $dx, $dy, 44, 44) }
      $g.DrawRectangle($line, $dx, $dy, 44, 44)
      T ([string]($i + 1)) $small $ink ($dx + 14) ($dy + 12) 20 20
    }
  }
}

Draw-Monitor 180 "DB" "Dashboard" "Today in People Ops" "Globex Bolivia - HR Admin" "dashboard"
Draw-Monitor 1030 "PE" "People" "Employee Profile" "Permission-aware HR record" "profile"
Draw-Monitor 1880 "LV" "Leave" "Leave Request" "Employee self-service approval" "leave"

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
