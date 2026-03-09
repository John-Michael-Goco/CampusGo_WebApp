export type StoreItem = {
    id: number;
    name: string;
    description: string | null;
    cost_points: number;
    stock: number;
    start_date: string | null;
    end_date: string | null;
    is_limited: boolean;
    is_visible: boolean;
};

export type StoreItemsFilters = {
    search: string;
    sort_by: string;
    sort_dir: string;
};

export type PaginatedStoreItems = {
    data: StoreItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type StorePageProps = {
    storeItems: PaginatedStoreItems;
    filters: StoreItemsFilters;
};
