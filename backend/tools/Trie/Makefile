CXX = g++
CXXFLAGS = -std=c++11 -Wall -Wextra -O2

# Source files
SOURCES = TrieNode.cpp TrieTree.cpp
HEADERS = TrieNode.h TrieTree.h
OBJECTS = $(SOURCES:.cpp=.o)

# Target executables
TARGET = trie_test
LIBRARY = libtrie.a

.PHONY: all clean test

all: $(TARGET) $(LIBRARY)

# Build test executable
$(TARGET): test.cpp $(OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Build static library
$(LIBRARY): $(OBJECTS)
	ar rcs $@ $^

# Compile object files
%.o: %.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Run tests
test: $(TARGET)
	./$(TARGET)

# Clean build files
clean:
	rm -f *.o $(TARGET) $(LIBRARY)

# Install library (optional)
install: $(LIBRARY)
	@echo "Library built: $(LIBRARY)"
	@echo "Copy to your system library path or use with -L flag"
