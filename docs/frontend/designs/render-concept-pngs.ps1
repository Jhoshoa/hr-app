Add-Type -AssemblyName System.Drawing

$OutDir = Join-Path $PSScriptRoot "."

function New-Brush($hex) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, $width = 1) {
  return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

function Draw-Text($g, $text, $font, $brush, $x, $y, $w, $h) {
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $g.DrawString($text, $font, $brush, $rect, $format)
}

function Fill-RoundRect($g, $brush, $x, $y, $w, $h) {
  $g.FillRectangle($brush, $x, $y, $w, $h)
}

function Stroke-RoundRect($g, $pen, $x, $y, $w, $h) {
  $g.DrawRectangle($pen, $x, $y, $w, $h)
}

function Draw-Metric($g, $theme, $x, $y, $label, $value) {
  Fill-RoundRect $g $theme.Surface $x $y 160 88
  Stroke-RoundRect $g $theme.LinePen $x $y 160 88
  Draw-Text $g $label $theme.Small $theme.MutedBrush ($x + 14) ($y + 12) 132 22
  Draw-Text $g $value $theme.Big $theme.InkBrush ($x + 14) ($y + 36) 132 42
}

function Draw-Table($g, $theme, $x, $y, $w) {
  Fill-RoundRect $g $theme.Subtle $x $y $w 34
  Draw-Text $g "Name" $theme.SmallBold $theme.MutedBrush ($x + 14) ($y + 9) 110 20
  Draw-Text $g "Department" $theme.SmallBold $theme.MutedBrush ($x + 165) ($y + 9) 120 20
  Draw-Text $g "Status" $theme.SmallBold $theme.MutedBrush ($x + 320) ($y + 9) 100 20
  $rows = @(
    @("Mariela Rojas", "People Ops", "Active"),
    @("Andres Campos", "Engineering", "Active"),
    @("Lucia Choque", "Talent", "Invited")
  )
  $rowY = $y + 42
  foreach ($row in $rows) {
    $g.DrawLine($theme.LinePen, $x, $rowY + 31, $x + $w, $rowY + 31)
    Draw-Text $g $row[0] $theme.Body $theme.InkBrush ($x + 14) $rowY 140 26
    Draw-Text $g $row[1] $theme.Body $theme.MutedBrush ($x + 165) $rowY 130 26
    Draw-Text $g $row[2] $theme.Body $theme.AccentBrush ($x + 320) $rowY 100 26
    $rowY += 38
  }
}

function Draw-Card($g, $theme, $x, $y, $w, $h, $title, $subtitle, $kind) {
  Fill-RoundRect $g $theme.Surface $x $y $w $h
  Stroke-RoundRect $g $theme.LinePen $x $y $w $h
  Fill-RoundRect $g $theme.Topbar ($x + 1) ($y + 1) ($w - 2) 54
  Draw-Text $g "AndesHR" $theme.Nav $theme.InkBrush ($x + 20) ($y + 15) 100 25
  Draw-Text $g "Dashboard   People   Leave   Documents   Reports" $theme.Small $theme.MutedBrush ($x + 145) ($y + 17) 360 22
  Draw-Text $g "Search..." $theme.Small $theme.MutedBrush ($x + $w - 130) ($y + 17) 90 22
  Draw-Text $g $title $theme.Title $theme.InkBrush ($x + 22) ($y + 76) ($w - 44) 35
  Draw-Text $g $subtitle $theme.Body $theme.MutedBrush ($x + 22) ($y + 112) ($w - 44) 34

  $cx = $x + 22
  $cy = $y + 162
  switch ($kind) {
    "metrics" {
      Draw-Metric $g $theme $cx $cy "Employees" "284"
      Draw-Metric $g $theme ($cx + 176) $cy "Pending" "18"
      Draw-Metric $g $theme ($cx + 352) $cy "Open jobs" "7"
      Fill-RoundRect $g $theme.SoftBrush $cx ($cy + 108) ($w - 44) 92
      Draw-Text $g "Operational summary: headcount, leave, documents, onboarding, recruiting." $theme.Body $theme.AccentBrush ($cx + 16) ($cy + 124) ($w - 76) 50
    }
    "profile" {
      $g.FillEllipse($theme.AccentBrush, $cx, $cy, 92, 92)
      Draw-Text $g "MR" $theme.BigWhite $theme.WhiteBrush ($cx + 18) ($cy + 24) 60 42
      Draw-Text $g "HR Manager - Cochabamba - Full-time" $theme.Body $theme.MutedBrush ($cx + 112) ($cy + 12) 330 28
      Draw-Table $g $theme $cx ($cy + 116) ($w - 44)
    }
    "form" {
      $labels = @("First name", "Last name", "Department", "Manager", "Start date", "Work mode")
      for ($i = 0; $i -lt 6; $i++) {
        $fx = $cx + (($i % 2) * 250)
        $fy = $cy + ([math]::Floor($i / 2) * 70)
        Fill-RoundRect $g $theme.SubtleBrush $fx $fy 230 52
        Draw-Text $g $labels[$i] $theme.SmallBold $theme.MutedBrush ($fx + 12) ($fy + 8) 190 18
        Draw-Text $g "Sample value" $theme.Body $theme.InkBrush ($fx + 12) ($fy + 27) 190 20
      }
    }
    "list" {
      Draw-Table $g $theme $cx $cy ($w - 44)
      Fill-RoundRect $g $theme.SoftBrush $cx ($cy + 170) ($w - 44) 44
      Draw-Text $g "Filters: department, location, manager, status, role." $theme.Body $theme.AccentBrush ($cx + 14) ($cy + 182) ($w - 72) 24
    }
    "kanban" {
      $lanes = @("Applied", "Screen", "Interview", "Offer")
      for ($i = 0; $i -lt 4; $i++) {
        $lx = $cx + ($i * 130)
        Fill-RoundRect $g $theme.SubtleBrush $lx $cy 112 210
        Draw-Text $g $lanes[$i] $theme.SmallBold $theme.MutedBrush ($lx + 10) ($cy + 10) 90 18
        Fill-RoundRect $g $theme.Surface ($lx + 10) ($cy + 42) 92 58
        Stroke-RoundRect $g $theme.LinePen ($lx + 10) ($cy + 42) 92 58
        Draw-Text $g "Candidate" $theme.Small $theme.InkBrush ($lx + 18) ($cy + 52) 76 18
        Draw-Text $g "Referral" $theme.Small $theme.MutedBrush ($lx + 18) ($cy + 73) 76 18
      }
    }
    default {
      Draw-Metric $g $theme $cx $cy "Total" "42"
      Draw-Metric $g $theme ($cx + 176) $cy "Due" "9"
      Draw-Table $g $theme $cx ($cy + 112) ($w - 44)
    }
  }
}

function New-Theme($name, $colors) {
  $font = "Segoe UI"
  return @{
    Name = $name
    Page = New-Brush $colors.Page
    Surface = New-Brush $colors.Surface
    Subtle = New-Brush $colors.Subtle
    SubtleBrush = New-Brush $colors.Subtle
    Topbar = New-Brush $colors.Topbar
    SoftBrush = New-Brush $colors.Soft
    InkBrush = New-Brush $colors.Ink
    MutedBrush = New-Brush $colors.Muted
    AccentBrush = New-Brush $colors.Accent
    WhiteBrush = New-Brush "#ffffff"
    LinePen = New-Pen $colors.Line
    Small = New-Object System.Drawing.Font($font, 11)
    SmallBold = New-Object System.Drawing.Font($font, 10, [System.Drawing.FontStyle]::Bold)
    Body = New-Object System.Drawing.Font($font, 13)
    Nav = New-Object System.Drawing.Font($font, 14, [System.Drawing.FontStyle]::Bold)
    Title = New-Object System.Drawing.Font($font, 22, [System.Drawing.FontStyle]::Bold)
    Big = New-Object System.Drawing.Font($font, 28, [System.Drawing.FontStyle]::Bold)
    BigWhite = New-Object System.Drawing.Font($font, 24, [System.Drawing.FontStyle]::Bold)
    BoardTitle = New-Object System.Drawing.Font($font, 40, [System.Drawing.FontStyle]::Bold)
    BoardSub = New-Object System.Drawing.Font($font, 16)
  }
}

function Render-Board($file, $title, $subtitle, $colors) {
  $theme = New-Theme $title $colors
  $bmp = New-Object System.Drawing.Bitmap(1800, 2600)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.FillRectangle($theme.Page, 0, 0, 1800, 2600)
  Draw-Text $g $title $theme.BoardTitle $theme.InkBrush 48 42 900 60
  Draw-Text $g $subtitle $theme.BoardSub $theme.MutedBrush 50 105 980 60
  $swatches = @($colors.Accent, $colors.Secondary, $colors.Ink, $colors.Soft, $colors.Surface)
  for ($i = 0; $i -lt $swatches.Count; $i++) {
    $b = New-Brush $swatches[$i]
    $g.FillRectangle($b, 1430 + ($i * 54), 58, 42, 42)
    $g.DrawRectangle((New-Pen "#d0d0d0"), 1430 + ($i * 54), 58, 42, 42)
    $b.Dispose()
  }

  $cards = @(
    @("Authenticated app shell", "Tenant-aware navigation, user menu, notifications, shortcuts.", "metrics"),
    @("Dashboard", "Headcount, approvals, leave, documents, onboarding, recruiting.", "metrics"),
    @("Employee list", "Searchable employee database with filters, import, export.", "list"),
    @("Employee profile", "Profile-centered HR record with tabs and permission-aware details.", "profile"),
    @("Employee create/edit", "Structured employee form for HR profile and job assignment.", "form"),
    @("Directory", "Permission-safe people directory for the whole company.", "list"),
    @("Leave overview", "Balances, upcoming time off, holidays, and request entry point.", "metrics"),
    @("Leave request form", "Leave type, dates, approver, balance preview, and reason.", "form"),
    @("Documents home", "Missing, expiring, policy, and acknowledgement document workspace.", "default"),
    @("Onboarding overview", "Active packets, overdue tasks, progress, and upcoming starts.", "metrics"),
    @("Recruiting job pipeline", "Kanban-style candidate pipeline for lightweight ATS workflows.", "kanban"),
    @("Reports home", "Standard reports, saved reports, filters, and exports.", "list"),
    @("Settings users and roles", "Users, invitations, roles, permissions, and access status.", "list")
  )

  $x0 = 48
  $y0 = 190
  $w = 540
  $h = 440
  for ($i = 0; $i -lt $cards.Count; $i++) {
    $col = $i % 3
    $row = [math]::Floor($i / 3)
    $x = $x0 + ($col * 584)
    $y = $y0 + ($row * 464)
    Draw-Card $g $theme $x $y $w $h $cards[$i][0] $cards[$i][1] $cards[$i][2]
  }

  $path = Join-Path $OutDir $file
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Render-Board "concept-01-verdant-operations.png" "Concept 01 - Verdant Operations" "Professional green HR system inspired by familiar employee-profile workflows, with clearer admin surfaces and compact operational data." @{
  Page = "#eef5ef"; Surface = "#ffffff"; Subtle = "#f6faf6"; Topbar = "#ffffff"; Ink = "#173329"; Muted = "#66756d"; Line = "#d9e5dc"; Accent = "#2f8f4e"; Secondary = "#7cb518"; Soft = "#e3f3e8"
}

Render-Board "concept-02-coastal-clarity.png" "Concept 02 - Coastal Clarity" "Calm teal SaaS workspace for HR teams that need fast scanning, clean lists, and approachable workflow states." @{
  Page = "#edf5f8"; Surface = "#ffffff"; Subtle = "#f5fafb"; Topbar = "#fbfeff"; Ink = "#102d35"; Muted = "#61757c"; Line = "#d6e4e8"; Accent = "#007c89"; Secondary = "#4aa3a2"; Soft = "#dff3f4"
}

Render-Board "concept-03-warm-executive.png" "Concept 03 - Warm Executive" "Elegant warm-neutral direction for a serious HR product that still feels friendly, readable, and grounded." @{
  Page = "#f7f4ee"; Surface = "#ffffff"; Subtle = "#fbf8f1"; Topbar = "#fffdf8"; Ink = "#2e2a22"; Muted = "#766f62"; Line = "#e7ddcd"; Accent = "#9c5f20"; Secondary = "#b8792f"; Soft = "#f4e8d6"
}
