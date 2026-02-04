.PHONY: local release open

# Use local source (for development)
local:
	xcodegen
	@echo "✓ Using local source (../)"

# Use released package (for testing)
release:
	xcodegen --spec project-release.yml
	@echo "✓ Using released package (locanara-swift)"

# Open Xcode
open:
	open LocanaraExample.xcodeproj
