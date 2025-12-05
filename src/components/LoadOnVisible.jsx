import React, { useEffect, useRef, useState, Suspense } from 'react';

// LoadOnVisible: dynamically loads a component when the placeholder becomes visible
// Props:
// - loader: () => import('./MyComponent')  (a function that returns the import promise)
// - fallback: ReactNode shown while loading
// - rootMargin: IntersectionObserver rootMargin
// - once: boolean (load only once)
// - loaderProps: props forwarded to the loaded component
const LoadOnVisible = ({ loader, fallback = null, rootMargin = '200px', once = true, loaderProps = {} }) => {
  const ref = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [LazyComp, setLazyComp] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    if (shouldLoad) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (once) io.disconnect();
          }
        });
      },
      { root: null, rootMargin }
    );

    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, shouldLoad, rootMargin, once]);

  useEffect(() => {
    if (!shouldLoad) return;
    // create a lazy component from loader
    const Comp = React.lazy(loader);
    setLazyComp(() => Comp);
  }, [shouldLoad, loader]);

  return (
    <div ref={ref}>
      {LazyComp ? (
        <Suspense fallback={fallback}>
          <LazyComp {...loaderProps} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LoadOnVisible;
