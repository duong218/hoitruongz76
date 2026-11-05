import { useState, useEffect } from 'react';

// Trả về giá trị sau khi người dùng ngừng thay đổi trong `delay` ms (dùng cho ô tìm kiếm)
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
