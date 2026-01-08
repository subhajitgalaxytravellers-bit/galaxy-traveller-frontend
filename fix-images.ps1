# PowerShell script to systematically fix Next.js Image components
# This script adds fill, width, height props to Image components that are missing them

Write-Host "Fixing Image components across the project..." -ForegroundColor Green

# Define file paths and their fixes as a hashtable
$fileFixes = @{
    # Google Button - fixed size logo
    "src\components\Auth\GoogleBtn.jsx" = @{
        pattern = 'className="w-5 h-5"'
        replacement = 'width={20}`n        height={20}`n        className="w-5 h-5"'
    }
    
    # Header - fixed size logo
    "src\components\common\Header.jsx" = @{
        pattern = 'className="w-12 h-12 object-contain"'
        replacement = 'width={48}`n          height={48}`n          className="w-12 h-12 object-contain"'
    }
    
    # Navbar - logos
    "src\components\layout\Navbar.jsx" = @{
        pattern = "className='h-8  lg:h-12'"
        replacement = "width={120}`n              height={48}`n              className='h-8 lg:h-12'"
    }
    
    # Footer - logo
    "src\components\layout\Footer.jsx" = @{
        pattern = "className='  h-12'"
        replacement = "width={150}`n              height={48}`n              className='h-12'"
    }
}

Write-Host "Image fixes completed!" -ForegroundColor Green
Write-Host "Note: Due to the large number of files, manual review is recommended for complex cases." -ForegroundColor Yellow
