param(
  [string]$Source = (Join-Path $PSScriptRoot '..\..\assets\images\enkh-ios-icon.png'),
  [string]$Output = (Join-Path $PSScriptRoot '..\assets\enkh.ico')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source))
$streams = [System.Collections.Generic.List[System.IO.MemoryStream]]::new()

try {
  foreach ($size in $sizes) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
      } finally {
        $graphics.Dispose()
      }

      $stream = [System.IO.MemoryStream]::new()
      $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
      $streams.Add($stream)
    } finally {
      $bitmap.Dispose()
    }
  }

  [System.IO.Directory]::CreateDirectory((Split-Path -Parent $Output)) | Out-Null
  $file = [System.IO.File]::Create($Output)
  $writer = [System.IO.BinaryWriter]::new($file)
  try {
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$sizes.Count)

    $offset = 6 + (16 * $sizes.Count)
    for ($index = 0; $index -lt $sizes.Count; $index++) {
      $size = $sizes[$index]
      $dataLength = [int]$streams[$index].Length
      $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
      $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]32)
      $writer.Write([uint32]$dataLength)
      $writer.Write([uint32]$offset)
      $offset += $dataLength
    }

    foreach ($stream in $streams) { $writer.Write($stream.ToArray()) }
  } finally {
    $writer.Dispose()
  }
} finally {
  foreach ($stream in $streams) { $stream.Dispose() }
  $sourceImage.Dispose()
}
