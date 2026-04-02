export function useToast(): {
    showToast: (message: string, type?: string) => void;
    showConfirm: (
        title: string,
        message: string,
        onConfirm: () => void | Promise<void>,
        onCancel?: () => void,
    ) => void;
};

export function ToastProvider(props: { children: React.ReactNode }): React.JSX.Element;
