#!/bin/bash

# GasLeap Demo Recording Script
# Creates a backup video recording of the demo for presentation reliability

set -e

# Configuration
DEMO_URL="http://localhost:3000"
OUTPUT_DIR="demo-recordings"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/gasleap-demo-${TIMESTAMP}.mp4"
DURATION=300  # 5 minutes
RESOLUTION="1920x1080"
FRAMERATE=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if ffmpeg is installed
    if ! command -v ffmpeg &> /dev/null; then
        print_error "ffmpeg is required but not installed"
        print_status "Install with: sudo apt-get install ffmpeg (Ubuntu/Debian) or brew install ffmpeg (macOS)"
        exit 1
    fi
    
    # Check if xvfb is available (for headless recording)
    if command -v xvfb-run &> /dev/null; then
        XVFB_AVAILABLE=true
        print_success "xvfb available for headless recording"
    else
        XVFB_AVAILABLE=false
        print_warning "xvfb not available - recording will require display"
    fi
    
    # Check if Chrome/Chromium is available
    if command -v google-chrome &> /dev/null; then
        CHROME_CMD="google-chrome"
    elif command -v chromium-browser &> /dev/null; then
        CHROME_CMD="chromium-browser"
    elif command -v chromium &> /dev/null; then
        CHROME_CMD="chromium"
    else
        print_error "Chrome or Chromium is required for recording"
        exit 1
    fi
    
    print_success "All dependencies available"
}

# Setup recording environment
setup_recording() {
    print_status "Setting up recording environment..."
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Check if demo is running
    if ! curl -s "$DEMO_URL" > /dev/null; then
        print_error "Demo is not running at $DEMO_URL"
        print_status "Please start the demo with: ./start-demo.sh"
        exit 1
    fi
    
    print_success "Demo is accessible at $DEMO_URL"
}

# Record demo using screen capture
record_screen_demo() {
    print_status "Starting screen recording of demo..."
    
    # Get display information
    if [ -n "$DISPLAY" ]; then
        DISPLAY_NUM="$DISPLAY"
    else
        DISPLAY_NUM=":0"
    fi
    
    print_status "Recording from display: $DISPLAY_NUM"
    print_status "Duration: ${DURATION} seconds"
    print_status "Output: $OUTPUT_FILE"
    
    # Start Chrome in kiosk mode
    print_status "Opening demo in Chrome..."
    $CHROME_CMD \
        --kiosk \
        --disable-infobars \
        --disable-extensions \
        --disable-plugins \
        --disable-web-security \
        --disable-features=VizDisplayCompositor \
        --window-size=1920,1080 \
        "$DEMO_URL" &
    
    CHROME_PID=$!
    
    # Wait for Chrome to load
    sleep 5
    
    # Record screen
    print_status "Starting screen recording..."
    ffmpeg -y \
        -f x11grab \
        -r $FRAMERATE \
        -s $RESOLUTION \
        -i $DISPLAY_NUM \
        -t $DURATION \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        -pix_fmt yuv420p \
        "$OUTPUT_FILE" &
    
    FFMPEG_PID=$!
    
    # Wait for recording to complete
    wait $FFMPEG_PID
    
    # Close Chrome
    kill $CHROME_PID 2>/dev/null || true
    
    print_success "Screen recording completed: $OUTPUT_FILE"
}

# Record demo using headless browser
record_headless_demo() {
    print_status "Starting headless recording of demo..."
    
    # Create virtual display
    export DISPLAY=:99
    
    print_status "Starting virtual display..."
    Xvfb :99 -screen 0 1920x1080x24 &
    XVFB_PID=$!
    
    # Wait for display to start
    sleep 2
    
    # Start Chrome in headless mode
    print_status "Opening demo in headless Chrome..."
    $CHROME_CMD \
        --display=$DISPLAY \
        --kiosk \
        --disable-infobars \
        --disable-extensions \
        --disable-plugins \
        --disable-web-security \
        --window-size=1920,1080 \
        "$DEMO_URL" &
    
    CHROME_PID=$!
    
    # Wait for Chrome to load
    sleep 5
    
    # Record screen
    print_status "Starting headless recording..."
    ffmpeg -y \
        -f x11grab \
        -r $FRAMERATE \
        -s $RESOLUTION \
        -i $DISPLAY \
        -t $DURATION \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        -pix_fmt yuv420p \
        "$OUTPUT_FILE" &
    
    FFMPEG_PID=$!
    
    # Wait for recording to complete
    wait $FFMPEG_PID
    
    # Cleanup
    kill $CHROME_PID 2>/dev/null || true
    kill $XVFB_PID 2>/dev/null || true
    
    print_success "Headless recording completed: $OUTPUT_FILE"
}

# Create demo automation script for recording
create_demo_automation() {
    print_status "Creating demo automation for recording..."
    
    cat > "${OUTPUT_DIR}/demo-automation.js" << 'EOF'
// Demo automation script for consistent recording
(function() {
    let currentStep = 0;
    const steps = [
        { action: 'wait', duration: 3000, description: 'Demo introduction' },
        { action: 'click', selector: '[data-testid="nft-mint-button"]', description: 'Start NFT minting' },
        { action: 'wait', duration: 15000, description: 'NFT minting process' },
        { action: 'click', selector: '[data-testid="continue-to-defi"]', description: 'Continue to DeFi' },
        { action: 'wait', duration: 3000, description: 'Navigate to DeFi page' },
        { action: 'click', selector: '[data-testid="provide-liquidity-button"]', description: 'Start liquidity provision' },
        { action: 'wait', duration: 15000, description: 'DeFi liquidity process' },
        { action: 'wait', duration: 10000, description: 'Show final results' }
    ];
    
    function executeStep(step) {
        console.log(`Executing step: ${step.description}`);
        
        switch (step.action) {
            case 'wait':
                setTimeout(() => nextStep(), step.duration);
                break;
                
            case 'click':
                const element = document.querySelector(step.selector);
                if (element) {
                    element.click();
                    setTimeout(() => nextStep(), 1000);
                } else {
                    console.warn(`Element not found: ${step.selector}`);
                    setTimeout(() => nextStep(), 1000);
                }
                break;
        }
    }
    
    function nextStep() {
        if (currentStep < steps.length) {
            executeStep(steps[currentStep]);
            currentStep++;
        } else {
            console.log('Demo automation complete');
        }
    }
    
    // Start automation after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(nextStep, 2000);
        });
    } else {
        setTimeout(nextStep, 2000);
    }
})();
EOF
    
    print_success "Demo automation script created"
}

# Generate demo metadata
generate_metadata() {
    print_status "Generating demo metadata..."
    
    cat > "${OUTPUT_DIR}/demo-metadata-${TIMESTAMP}.json" << EOF
{
    "recording": {
        "timestamp": "$(date -Iseconds)",
        "duration": ${DURATION},
        "resolution": "${RESOLUTION}",
        "framerate": ${FRAMERATE},
        "filename": "$(basename "$OUTPUT_FILE")"
    },
    "demo": {
        "version": "1.0.0",
        "scenarios": [
            {
                "name": "NFT Minting",
                "chain": "Astar",
                "duration": "~60 seconds",
                "description": "Demonstrates sponsored NFT minting on Astar parachain"
            },
            {
                "name": "DeFi Liquidity",
                "chain": "Acala", 
                "duration": "~60 seconds",
                "description": "Demonstrates sponsored liquidity provision on Acala parachain"
            }
        ],
        "features": [
            "Cross-chain gas sponsorship",
            "Real-time gas savings tracking",
            "Seamless user experience",
            "No wallet switching required"
        ]
    },
    "technical": {
        "node_endpoint": "ws://localhost:9944",
        "frontend_url": "${DEMO_URL}",
        "recording_method": "screen_capture"
    }
}
EOF
    
    print_success "Demo metadata generated"
}

# Optimize recorded video
optimize_video() {
    if [ -f "$OUTPUT_FILE" ]; then
        print_status "Optimizing recorded video..."
        
        OPTIMIZED_FILE="${OUTPUT_FILE%.mp4}-optimized.mp4"
        
        ffmpeg -y \
            -i "$OUTPUT_FILE" \
            -c:v libx264 \
            -preset slow \
            -crf 20 \
            -c:a aac \
            -b:a 128k \
            -movflags +faststart \
            "$OPTIMIZED_FILE"
        
        if [ -f "$OPTIMIZED_FILE" ]; then
            print_success "Optimized video created: $OPTIMIZED_FILE"
            
            # Compare file sizes
            ORIGINAL_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE")
            OPTIMIZED_SIZE=$(stat -f%z "$OPTIMIZED_FILE" 2>/dev/null || stat -c%s "$OPTIMIZED_FILE")
            
            print_status "Original size: $(numfmt --to=iec $ORIGINAL_SIZE)"
            print_status "Optimized size: $(numfmt --to=iec $OPTIMIZED_SIZE)"
        fi
    fi
}

# Main recording function
main() {
    echo "🎥 GasLeap Demo Recording System"
    echo "================================"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --duration)
                DURATION="$2"
                shift 2
                ;;
            --resolution)
                RESOLUTION="$2"
                shift 2
                ;;
            --headless)
                FORCE_HEADLESS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --duration SECONDS    Recording duration (default: 300)"
                echo "  --resolution WxH      Recording resolution (default: 1920x1080)"
                echo "  --headless           Force headless recording"
                echo "  --help               Show this help"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    check_dependencies
    
    # Setup recording environment
    setup_recording
    
    # Create demo automation
    create_demo_automation
    
    # Choose recording method
    if [ "$FORCE_HEADLESS" = true ] || [ "$XVFB_AVAILABLE" = true ] && [ -z "$DISPLAY" ]; then
        record_headless_demo
    else
        record_screen_demo
    fi
    
    # Generate metadata
    generate_metadata
    
    # Optimize video
    optimize_video
    
    # Final summary
    echo ""
    print_success "Demo recording complete!"
    print_status "Recording saved to: $OUTPUT_FILE"
    print_status "Metadata saved to: ${OUTPUT_DIR}/demo-metadata-${TIMESTAMP}.json"
    
    if [ -f "${OUTPUT_FILE%.mp4}-optimized.mp4" ]; then
        print_status "Optimized version: ${OUTPUT_FILE%.mp4}-optimized.mp4"
    fi
    
    echo ""
    print_status "You can now use this recording as a backup during your presentation!"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up recording processes..."
    
    # Kill any remaining processes
    pkill -f "google-chrome.*$DEMO_URL" 2>/dev/null || true
    pkill -f "chromium.*$DEMO_URL" 2>/dev/null || true
    pkill -f "Xvfb :99" 2>/dev/null || true
    
    print_success "Cleanup complete"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"