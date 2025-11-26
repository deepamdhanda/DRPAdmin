import React, { useEffect, useState } from "react";
import { getAllUsers } from "../../APIs/user";

type Count = {
    label: string;
    count: number;
};

type Pool = {
    _id: string;
    name: string;
    wallet_balance: string;
};

type UserData = {
    counts: Count[];
    pools: Pool[];
    hasProducts: boolean;
    hasSKUs: boolean;
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    user_createdAt: string;
    user_verified: boolean;
    user_role: string;
};

const roleColors: Record<string, string> = {
    admin: "#4CAF50",
    manager: "#2196F3",
    newUser: "#FF9800",
    guest: "#9E9E9E",
};

const USERS_PER_PAGE = 20;

const UserScreen: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = (pageNumber: number, filter: string = "") => {
        console.log("Fetching users", { pageNumber, filter });
        setLoading(true);
        getAllUsers()
            .then((data) => {
                setUsers(data);
                setTotalPages(Math.ceil(users.length / USERS_PER_PAGE));
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load users.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUsers(page, searchTerm);
    }, [page, searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>User Overview</h1>

            <div style={styles.searchWrapper}>
                <input
                    type="search"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={styles.searchInput}
                    aria-label="Search users"
                />
            </div>

            {loading ? (
                <p style={styles.loading}>Loading user data…</p>
            ) : error ? (
                <p style={styles.error}>{error}</p>
            ) : users.length === 0 ? (
                <p style={styles.empty}>No users found.</p>
            ) : (
                <>
                    <div style={styles.grid}>
                        {users.map((user) => (
                            <article
                                key={user.user_id}
                                style={styles.card}
                                aria-label={`User ${user.user_name}`}
                            >
                                <header style={styles.header}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <span
                                            style={{
                                                color: user.user_verified ? "#4caf50" : "#f44336",
                                                fontWeight: "600",

                                                marginRight: "5px",
                                            }}
                                        >
                                            {user.user_verified ? "✅" : "❌"}
                                        </span>
                                        <h2 style={styles.userName}>{user.user_name}</h2>

                                    </div>
                                    <span
                                        style={{
                                            ...styles.roleBadge,
                                            backgroundColor: roleColors[user.user_role] || "#757575",
                                        }}
                                        aria-label={`Role: ${user.user_role}`}
                                    >
                                        {user.user_role}
                                    </span>
                                </header>
                                <header style={styles.header}>
                                    <p style={styles.email}>
                                        {user.user_email}<br />
                                        {user.user_phone && <a href={`${user.user_phone}`}>📞 {user.user_phone}</a>}
                                    </p>

                                    <p style={styles.createdAt}>
                                        {new Date(user.user_createdAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </header>
                                <section style={styles.countsSection} aria-label="User statistics">
                                    <h3 style={styles.subHeading}>Key Metrics</h3>
                                    {user.counts.length === 0 ? (
                                        <p style={styles.empty}>No metrics available.</p>
                                    ) : (
                                        <ul style={styles.countsList}>
                                            {user.counts.map(({ label, count }) => (
                                                <li key={label} style={styles.countItem}>
                                                    <span>{label}</span>
                                                    <span style={styles.countValue}>{count}</span>
                                                </li>
                                            ))}
                                            <li key={"Products Linked"} style={styles.countItem}>
                                                <span>Products Linked:</span>
                                                <span style={styles.countValue}>{user.hasProducts ? "Yes" : "No"}</span>
                                            </li>
                                            <li key={"SKUs Linked"} style={styles.countItem}>
                                                <span>SKUs Linked:</span>
                                                <span style={styles.countValue}>{user.hasSKUs ? "Yes" : "No"}</span>
                                            </li>
                                        </ul>
                                    )}
                                </section>

                                <section style={styles.poolsSection} aria-label="User pools">
                                    <h3 style={styles.subHeading}>Pools</h3>
                                    {user.pools.length === 0 ? (
                                        <p style={styles.empty}>No pools linked.</p>
                                    ) : (
                                        <ul style={styles.poolsList}>
                                            {user.pools.map(({ _id, name, wallet_balance }) => (
                                                <li key={_id} style={styles.poolItem}>
                                                    <strong>Pool:</strong> {name}<br />
                                                    <strong>ID:</strong> {_id}<br />
                                                    <strong>Balance:</strong> ₹{wallet_balance}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>

                                <section style={styles.flagsSection}>

                                </section>
                            </article>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <nav
                        aria-label="User list pagination"
                        style={styles.paginationNav}
                    >
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={styles.pageButton}
                            aria-disabled={page === 1}
                            aria-label="Previous page"
                        >
                            ← Prev
                        </button>
                        <span style={styles.pageIndicator}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={styles.pageButton}
                            aria-disabled={page === totalPages}
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </nav>
                </>
            )
            }
        </div >
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 1200,
        margin: "2rem auto",
        padding: "0 1rem",
        fontFamily:
            '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        color: "#212121",
    },
    heading: {
        fontSize: "2.5rem",
        marginBottom: "1.5rem",
        fontWeight: 700,
        borderBottom: "2px solid #2196f3",
        paddingBottom: "0.5rem",
    },
    searchWrapper: {
        marginBottom: "1rem",
    },
    searchInput: {
        width: "100%",
        maxWidth: 400,
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        borderRadius: 6,
        border: "1px solid #ccc",
        outline: "none",
        transition: "border-color 0.3s",
    },
    searchInputFocus: {
        borderColor: "#2196f3",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: "1.5rem",
    },
    card: {
        backgroundColor: "#fff",
        padding: "1.5rem",
        borderRadius: 8,
        boxShadow:
            "0 4px 8px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
    },
    userName: {
        fontSize: "1.5rem",
        margin: 0,
        fontWeight: 700,
        color: "#1976d2",
    },
    roleBadge: {
        padding: "0.3em 0.8em",
        borderRadius: 12,
        color: "white",
        fontWeight: "600",
        fontSize: "0.85rem",
        textTransform: "capitalize",
    },
    email: {
        fontSize: "1rem",
        margin: "0.2rem 0 0.6rem",
        color: "#555",
    },
    verified: {
        fontSize: "0.95rem",
        margin: "0 0 0.3rem",
    },
    createdAt: {
        fontSize: "0.9rem",
        color: "#777",
        marginBottom: "1rem",
    },
    subHeading: {
        fontSize: "1.1rem",
        marginBottom: "0.8rem",
        borderBottom: "1px solid #eee",
        paddingBottom: "0.3rem",
        fontWeight: 600,
    },
    countsSection: {
        marginBottom: "1rem",
    },
    countsList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
    },
    countItem: {
        display: "flex",
        justifyContent: "space-between",
        padding: "0.25rem 0",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "0.95rem",
    },
    countValue: {
        fontWeight: "700",
        color: "#333",
    },
    poolsSection: {
        marginBottom: "1rem",
    },
    poolsList: {
        listStyle: "none",
        paddingLeft: 0,
        margin: 0,
    },
    poolItem: {
        backgroundColor: "#f9f9f9",
        padding: "0.5rem 0.75rem",
        borderRadius: 4,
        marginBottom: 6,
        fontSize: "0.9rem",
    },
    flagsSection: {
        fontSize: "0.95rem",
        color: "#444",
        marginTop: "auto",
    },
    loading: {
        textAlign: "center",
        fontSize: "1.25rem",
        color: "#888",
    },
    error: {
        color: "red",
        fontWeight: "600",
        textAlign: "center",
    },
    empty: {
        textAlign: "center",
        fontStyle: "italic",
        color: "#666",
    },
    paginationNav: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "2rem",
        gap: "1rem",
    },
    pageButton: {
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        cursor: "pointer",
        borderRadius: 6,
        border: "1px solid #2196f3",
        backgroundColor: "#2196f3",
        color: "white",
        transition: "background-color 0.3s",
        userSelect: "none",
    },
    pageIndicator: {
        fontWeight: "600",
    },
};

export default UserScreen;
