# at-path

Robustly access a nested value from an object path using a dot-delimited string.

## Usage

### `getter = getPath(path)`

Creates a getter function for that particular `path`. This is an optimisation
to save on the inital cost of processing the path string, so you should cache
it where appropriate if that's your thing.

### `value = getter(object)`

You can then pass this new function an `object` and it'll traverse its keys
to get the target value. If it doesn't exist, you'll get `undefined` in return.
