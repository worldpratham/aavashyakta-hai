import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type RouterContextType = {
  path: string;
  pathname: string;
  search: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : '/'
  );

  useEffect(() => {
    const onPop = () =>
      setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(to: string) {
    if (to === path) return;
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }

  const pathname = path.split('?')[0].split('#')[0] || '/';
  const search = path.includes('?') ? '?' + path.split('?')[1].split('#')[0] : '';

  return (
    <RouterContext.Provider value={{ path, pathname, search, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({
  to,
  children,
  className,
  onClick,
  id,
  title,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  title?: string;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      id={id}
      title={title}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
