# Remove Max Number of Edges to Keep Graph Fully Traversable

Alice and Bob have an undirected graph of n nodes and three types of edges:

Type 1: Can be traversed by Alice only.
Type 2: Can be traversed by Bob only.
Type 3: Can be traversed by both Alice and Bob.
Given an array edges where edges[i] = [typei, ui, vi] represents a bidirectional edge of type typei between nodes ui and vi, find the maximum number of edges you can remove so that after removing the edges, the graph can still be fully traversed by both Alice and Bob. The graph is fully traversed by Alice and Bob if starting from any node, they can reach all other nodes.

Return the maximum number of edges you can remove, or return -1 if Alice and Bob cannot fully traverse the graph.

Constraints:

1 <= n <= 105
1 <= edges.length <= min(105, 3 * n * (n - 1) / 2)
edges[i].length == 3
1 <= typei <= 3
1 <= ui < vi <= n
All tuples (typei, ui, vi) are distinct.

---

```
class UnionFind {
    vector<int> representative;
    vector<int> componentSize;
    int components;

public:
    UnionFind(int n) {
        components = n;
        for (int i = 0; i <= n; i++) {
            representative.push_back(i);
            componentSize.push_back(1);
        }
    }

    int findRepresentative(int x) {
        if (representative[x] == x) return x;

        return representative[x] = findRepresentative(representative[x]);
    }

    int performUnion(int x, int y) {
        x = findRepresentative(x), y = findRepresentative(y);

        if (x == y) return 0;

        if (componentSize[x] > componentSize[y]) {
            componentSize[x] += componentSize[y];
            representative[y] = x;
        } else {
            componentSize[y] += componentSize[x];
            representative[x] = y;
        }

        components--;
        return 1;
    }

    bool isConnected() {
        return components == 1;
    }
};

class Solution {
public:
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        UnionFind Alice(n), Bob(n);

        int edgesRequired = 0;

        for (auto edge : edges)
            if (edge[0] == 3)
                edgesRequired += (Alice.performUnion(edge[1], edge[2]) | Bob.performUnion(edge[1], edge[2]));

        for (auto edge : edges) {
            if (edge[0] == 1) edgesRequired += Alice.performUnion(edge[1], edge[2]);
            else if (edge[0] == 2) edgesRequired += Bob.performUnion(edge[1], edge[2]);
        }

        if (Alice.isConnected() && Bob.isConnected()) return edges.size() - edgesRequired;

        return -1;
    }
};
```

runtime efficient solution:

```
class DisjointSet {
    vector<int> rank, parent, size;

public:
    DisjointSet(int n) {
        rank.resize(n + 1, 0);
        parent.resize(n + 1);
        size.resize(n + 1);
        for (int i = 0; i <= n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    int findUPar(int node) {
        if (node == parent[node])
            return node;
        return parent[node] = findUPar(parent[node]);
    }

    void unionByRank(int u, int v) {
        int ulp_u = findUPar(u);
        int ulp_v = findUPar(v);
        if (ulp_u == ulp_v)
            return;
        if (rank[ulp_u] < rank[ulp_v]) {
            parent[ulp_u] = ulp_v;
        } else if (rank[ulp_v] < rank[ulp_u]) {
            parent[ulp_v] = ulp_u;
        } else {
            parent[ulp_v] = ulp_u;
            rank[ulp_u]++;
        }
    }

    void unionBySize(int u, int v) {
        int ulp_u = findUPar(u);
        int ulp_v = findUPar(v);
        if (ulp_u == ulp_v)
            return;
        if (size[ulp_u] < size[ulp_v]) {
            parent[ulp_u] = ulp_v;
            size[ulp_v] += size[ulp_u];
        } else {
            parent[ulp_v] = ulp_u;
            size[ulp_u] += size[ulp_v];
        }
    }
};
class Solution {
public:
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        ios_base::sync_with_stdio(false);
        DisjointSet ds1(n+1);
        DisjointSet ds2(n+1);
        int cnt = 0;
        for (auto& e : edges) {
            if (e[0] == 3) {
                if ((ds1.findUPar(e[1]) == ds1.findUPar(e[2])) &&
                    (ds2.findUPar(e[1]) == ds2.findUPar(e[2]))) {
                    cnt++;
                } else {
                    ds1.unionByRank(e[1], e[2]);
                    ds2.unionByRank(e[1], e[2]);
                }
            }
        }
        for (auto& e : edges) {
            if (e[0] == 1) {
                if ((ds1.findUPar(e[1]) == ds1.findUPar(e[2]))) {
                    cnt++;
                } else {
                    ds1.unionByRank(e[1], e[2]);
                }
            } else if (e[0] == 2) {
                if ((ds2.findUPar(e[1]) == ds2.findUPar(e[2]))) {
                    cnt++;
                } else {
                    ds2.unionByRank(e[1], e[2]);
                }
            }
        }
        int ct1=0;
        int ct2=0;
        for(int i=1; i<=n; i++)
        {
            if(ds1.findUPar(i)==i)
            {
                ct1++;
            }
            if(ds2.findUPar(i)==i)
            {
                ct2++;
            }
        }
        if(ct1>1 || ct2>1)
        {
            return -1;
        }

        return cnt;
    }
};
```

The second implementation of the solution is considered more efficient than the first due to several reasons related to the data structures used and the specific optimizations applied. Here's a detailed comparison of the key differences and why they contribute to the efficiency:

### 1. Data Structure: Union-Find with Path Compression and Union by Rank/Size

**First Implementation (UnionFind Class):**
- Uses a straightforward Union-Find data structure with path compression and union by size.
- Path compression optimizes the `findRepresentative` method by making nodes point directly to the root representative, reducing the time complexity for future queries.
- Union by size ensures that the smaller tree is always merged into the larger tree, balancing the tree height and improving efficiency.

**Second Implementation (DisjointSet Class):**
- Enhances the Union-Find data structure by using both union by rank and union by size, providing flexibility and ensuring optimal tree balancing.
- The use of `rank` ensures that the tree height remains logarithmic, further optimizing the union operation.
- Path compression is also applied in the `findUPar` method, similar to the first implementation, but with the addition of rank-based optimization, it is slightly more efficient.

### 2. Handling of Union Operations

**First Implementation:**
- Separately performs union operations for Alice and Bob using the `performUnion` method.
- Checks for the edge type (1 for Alice, 2 for Bob, 3 for both) and applies union operations accordingly.
- The union operations are done sequentially, which might lead to repetitive checks and operations.

**Second Implementation:**
- Combines the union operations for both Alice and Bob more efficiently by checking the type of edge once and applying the union operations using rank.
- Uses a single loop to handle type 3 edges first, ensuring both Alice and Bob's sets are updated simultaneously, reducing redundant operations.
- Additional loops for type 1 and type 2 edges ensure specific union operations for Alice and Bob without redundant checks.

### 3. Edge Counting and Connectivity Check

**First Implementation:**
- Uses the `components` variable to keep track of the number of components and checks connectivity with `isConnected`.
- Manages the number of required edges separately for Alice and Bob, leading to a slightly more complex counting mechanism.

**Second Implementation:**
- Directly counts redundant edges (`cnt`) during the union operations, simplifying the edge counting process.
- After processing all edges, it checks the number of connected components by counting unique parents in both sets, ensuring both Alice and Bob are fully connected.
- This approach simplifies the final connectivity check and reduces the number of operations needed.

### Conclusion

The second implementation is more efficient primarily due to:
- The use of both union by rank and union by size, which provides better tree balancing and reduces the height of the trees.
- A more streamlined process for handling union operations, especially for type 3 edges, reducing redundant operations and checks.
- Simplified edge counting and connectivity check, which reduces the complexity and number of operations.

These optimizations lead to faster execution times, especially for larger inputs, making the second implementation more efficient.

Runtime efficient 2:

```
class DisjointSet{
public: 
    vector<int> parent;
    vector<int> rank;

    DisjointSet(int n){
        parent.resize(n);
        rank.resize(n, 0);

        for (int i = 0; i < n; i++){
            parent[i] = i;
        }
    }

    int getUltParent(int node){
        node = parent[node];
        while (node != parent[node]){
            parent[node] = parent[parent[node]];
            node = parent[node];
        }
        return node;
    }

    bool unionByRank(int n1, int n2){
        int p1 = getUltParent(n1);
        int p2 = getUltParent(n2);

        if (p1 == p2) return false;

        int rank1 = rank[p1];
        int rank2 = rank[p2];

        if (rank1 == rank2){
            parent[p2] = p1;
            rank[p1]++;
        }
        else if (rank1 > rank2){
            parent[p2] = p1;
        }
        else{
            parent[p1] = p2; 
        }

        return true;
    }
};

class Solution {
private:
    bool isConnectedGraph(DisjointSet *ds){
        int n = ds->parent.size();
        int numComponents = 0;
        for (int i = 0; i < n; i++){
            if (ds->parent[i] == i) numComponents++;
        }
        return numComponents == 1;
    }

    int setInsert(DisjointSet *ds, vector<vector<int>>& edges, int edgeType){
        int numRemovals = 0;

        for (const vector<int>& edge : edges){
            if (edge[0] != edgeType) continue;
            if (ds->unionByRank(edge[1] - 1, edge[2] - 1) == false){
                numRemovals++;
            }
        }
        return numRemovals; 
    }
public:
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        DisjointSet *Alice = new DisjointSet(n);
        DisjointSet *Bob = new DisjointSet(n);
        int numRemovals = 0;

        numRemovals += setInsert(Alice, edges, 3);
        setInsert(Bob, edges, 3);

        numRemovals += setInsert(Alice, edges, 1);
        numRemovals += setInsert(Bob, edges, 2);

        if (!isConnectedGraph(Alice) || !isConnectedGraph(Bob)) return -1;
        return numRemovals;
    }
};
```

The provided implementation of the `Solution` class leverages a Disjoint Set Union (DSU) structure to solve the problem efficiently. Here’s an analysis of its runtime efficiency:

### Key Features of the Implementation

1. **DisjointSet Class**:
2. **Initialization**:

   ```
   DisjointSet(int n){
       parent.resize(n);
       rank.resize(n, 0);
       for (int i = 0; i < n; i++){
           parent[i] = i;
       }
   }
   ```

   The DSU is initialized with `parent` and `rank` vectors, ensuring all nodes are their own parents initially, and all ranks are set to zero.
3. **Find with Path Compression**:

   ```
   int getUltParent(int node){
       node = parent[node];
       while (node != parent[node]){
           parent[node] = parent[parent[node]];
           node = parent[node];
       }
       return node;
   }
   ```

   The `getUltParent` method uses path compression to keep the tree flat, which ensures that future `find` operations are fast.
4. **Union by Rank**:

   ```
   bool unionByRank(int n1, int n2){
       int p1 = getUltParent(n1);
       int p2 = getUltParent(n2);
       if (p1 == p2) return false;

       if (rank[p1] == rank[p2]){
           parent[p2] = p1;
           rank[p1]++;
       } else if (rank[p1] > rank[p2]){
           parent[p2] = p1;
       } else {
           parent[p1] = p2; 
       }
       return true;
   }
   ```

   The `unionByRank` method merges two sets by their rank, which ensures the smaller tree is added under the root of the larger tree, maintaining balance.
5. **Solution Class**:
6. **Edge Processing**:

   ```
   int setInsert(DisjointSet *ds, vector<vector<int>>& edges, int edgeType){
       int numRemovals = 0;
       for (const vector<int>& edge : edges){
           if (edge[0] != edgeType) continue;
           if (ds->unionByRank(edge[1] - 1, edge[2] - 1) == false){
               numRemovals++;
           }
       }
       return numRemovals; 
   }
   ```

   The `setInsert` method processes edges of a particular type and tries to merge the sets. If the sets are already connected, it counts the edge as redundant.
7. **Connectivity Check**:

   ```
   bool isConnectedGraph(DisjointSet *ds){
       int n = ds->parent.size();
       int numComponents = 0;
       for (int i = 0; i < n; i++){
           if (ds->parent[i] == i) numComponents++;
       }
       return numComponents == 1;
   }
   ```

   The `isConnectedGraph` method checks if there is exactly one connected component, meaning the graph is fully connected.
8. **Main Logic**:

   ```
   int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
       DisjointSet *Alice = new DisjointSet(n);
       DisjointSet *Bob = new DisjointSet(n);
       int numRemovals = 0;

       numRemovals += setInsert(Alice, edges, 3);
       setInsert(Bob, edges, 3);
       numRemovals += setInsert(Alice, edges, 1);
       numRemovals += setInsert(Bob, edges, 2);

       if (!isConnectedGraph(Alice) || !isConnectedGraph(Bob)) return -1;
       return numRemovals;
   }
   ```

### Runtime Efficiency

- **Time Complexity**:
- **Initialization**: Initializing the DSU structures takes O(n) time.
- **Sorting**: Sorting the edges takes O(m log m) time, where m is the number of edges.
- **Edge Processing**: Processing each edge involves `find` and `union` operations, both of which are nearly constant time, i.e., O(α(n)), where α is the inverse Ackermann function, which is very slow-growing. Since each edge is processed at most once, this part takes O(m α(n)) time.

The overall time complexity is dominated by the sorting step, so it is O(m log m + m α(n)). Given that α(n) is very small, it is effectively O(m log m).

- **Space Complexity**:
- The space complexity is O(n) for the `parent` and `rank` vectors in each DSU instance, resulting in a total of O(n) space for each Alice and Bob structures.

### Conclusion

The solution is efficient in terms of both time and space. The use of DSU with path compression and union by rank ensures that operations are nearly constant time. The edge processing logic is streamlined by sorting and categorizing edges, ensuring that redundant edges are identified efficiently. The early termination check for connectivity further optimizes the runtime by potentially reducing unnecessary computations.

Memory Efficient:

```
class Solution {
public:
    int count=0;
    int parent[100001];
    int size[100001];
    void make(int v){
        parent[v]=v;
        size[v]=1;
    }
    int find(int v){
        if(v==parent[v]) return v;
        return parent[v]=find(parent[v]);
    }
    bool merge(int a,int b){
        a=find(a);
        b=find(b);
        if(a==b) return false;
        if(size[b]>size[a]) swap(a,b);
        parent[b]=a;
        size[a]+=size[b];
        return true;
    }
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        sort(edges.begin(),edges.end());
        reverse(edges.begin(),edges.end());
        int count=0;
        for(int i=1;i<=n;i++){
            make(i);
        }
        for(int i=0;i<edges.size();i++){
            int t=edges[i][0];
            int u=edges[i][1];
            int v=edges[i][2];
            if(t==3 || t==2){
                bool b=merge(u,v);
                if(b==false) count++;
            }
        }
        for(int i=1;i<=n;i++){
            if(find(1)!=find(i)) return -1;
        }

        for(int i=1;i<=n;i++){
            make(i);
        }
        for(int i=0;i<edges.size();i++){
            int t=edges[i][0];
            int u=edges[i][1];
            int v=edges[i][2];
            if(t==1){
                bool b=merge(u,v);
                if(b==false) count++;
            }
            else if(t==3){
                merge(u,v);
            }
        }
        for(int i=1;i<=n;i++){
            if(find(1)!=find(i)) return -1;
        }
        return count;
    }
};
```

The given implementation of the `Solution` class is designed to be more memory efficient due to several key reasons:

### 1. Fixed-size Arrays

The `parent` and `size` arrays are declared with a fixed size of 100001:

```
int parent[100001];
int size[100001];
```

This ensures that memory allocation happens only once and avoids the overhead associated with dynamic memory allocation using `std::vector`.

### 2. Efficient Union-Find Operations

The union-find operations (`find`, `make`, and `merge`) are implemented with path compression and union by size, which are both memory-efficient operations:
- **Path Compression:** This technique ensures that the tree height remains small, which speeds up future operations and reduces the overall memory footprint required for tree traversal.
- **Union by Size:** By always attaching the smaller tree under the root of the larger tree, the height of the trees remains balanced, ensuring that the depth of any node is logarithmic with respect to the number of nodes, reducing the overall memory usage.

### 3. Avoidance of Redundant Data Structures

Unlike some implementations which might use multiple union-find data structures for Alice and Bob separately, this implementation uses a single union-find structure, reusing it efficiently to avoid redundant memory usage:
- **Single Union-Find Structure:** The same `parent` and `size` arrays are reused for both types of edges (type 2 and type 3 for Bob first, then type 1 and type 3 for Alice), reducing the memory footprint by not requiring separate structures.

### 4. Iterative Reinitialization

The reinitialization of the union-find structure for the second pass (for Alice) is done in-place by reusing the same arrays:

```
for(int i=1;i<=n;i++){
    make(i);
}
```

This approach avoids the need to create additional arrays or copies of the data, ensuring that the memory usage remains minimal.

### Summary of Memory Efficiency

- **Fixed-size arrays** prevent the overhead of dynamic memory allocation.
- **Path compression and union by size** ensure efficient memory usage in union-find operations.
- **Reusing the same union-find structure** for both types of edges reduces redundant memory allocation.
- **In-place reinitialization** of the union-find structure further minimizes memory overhead.

Overall, the combination of these techniques ensures that the solution is both time-efficient and memory-efficient, making it suitable for handling large inputs within the constraints typically found in competitive programming or interview scenarios.

Mempry Efficient 2:

```
class Solution {
public:
    class DSU{
        public:
        vector<int> parent;
        vector<int> rank;
        int components;

        DSU(int n){
            parent.resize(n+1);
            for(int i=0; i<=n; i++){
                parent[i] = i;
            }
            rank.resize(n+1);
            components = n;
        }

        int find (int x) {
            if (x == parent[x]) 
            return x;

            return parent[x] = find(parent[x]);
        }

        void Union (int x, int y) {
            int x_parent = find(x);
            int y_parent = find(y);

            if (x_parent == y_parent) 
                return;

            if(rank[x_parent] > rank[y_parent]) {
                parent[y_parent] = x_parent;
            } else if(rank[x_parent] < rank[y_parent]) {
                parent[x_parent] = y_parent;
            } else {
                parent[x_parent] = y_parent;
                rank[y_parent]++;
            }
            components--;
        }
        bool isSingleComponent(){
            return components == 1;
        }
    };

    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        DSU Alice(n);
        DSU Bob(n);

        auto lambda = [&](vector<int>&vec1,vector<int>&vec2){
            return vec1[0] > vec2[0];
        }; 
        sort(begin(edges),end(edges),lambda);
        int edgeCount = 0;
        for(auto &vec:edges){
            int type = vec[0];
            int u = vec[1];
            int v = vec[2];

            if(type == 3){
                bool addEdge = false;
                if(Alice.find(u) != Alice.find(v)){
                    Alice.Union(u,v);
                    addEdge = true;
                }
                if(Bob.find(u) != Bob.find(v)){
                    Bob.Union(u,v);
                    addEdge = true;
                }
                if(addEdge == true) edgeCount++;
            }else if(type == 2){
                if(Bob.find(u) != Bob.find(v)){
                    Bob.Union(u,v);
                    edgeCount++;
                }
            }else{
                if(Alice.find(u) != Alice.find(v)){
                    Alice.Union(u,v);
                    edgeCount++;
                }
            }
            if(Alice.isSingleComponent() && Bob.isSingleComponent()){
                return edges.size() - edgeCount;
        }

        }
        return -1;
    }
};
```

The given implementation of the `Solution` class, utilizing the Disjoint Set Union (DSU) data structure, is both efficient and effective in solving the problem. Below is an analysis of why it is efficient and well-suited for the task:

### Key Aspects of the Implementation

1. **DSU (Disjoint Set Union) Class**:

   - **Initialization**:

     ```
     DSU(int n){
         parent.resize(n+1);
         for(int i=0; i<=n; i++){
             parent[i] = i;
         }
         rank.resize(n+1);
         components = n;
     }
     ```

     The DSU class initializes the `parent` and `rank` vectors, and sets the number of components to `n`. This ensures that each node starts as its own parent, and all ranks are initially zero.
   - **Find with Path Compression**:

     ```
     int find (int x) {
         if (x == parent[x]) 
             return x;
         return parent[x] = find(parent[x]);
     }
     ```

     The `find` function uses path compression to flatten the structure of the tree, ensuring that future queries are faster.
   - **Union by Rank**:

     ```
     void Union (int x, int y) {
         int x_parent = find(x);
         int y_parent = find(y);

         if (x_parent == y_parent) 
             return;

         if(rank[x_parent] > rank[y_parent]) {
             parent[y_parent] = x_parent;
         } else if(rank[x_parent] < rank[y_parent]) {
             parent[x_parent] = y_parent;
         } else {
             parent[x_parent] = y_parent;
             rank[y_parent]++;
         }
         components--;
     }
     ```

     The `Union` function uses rank to ensure that the smaller tree is always added under the root of the larger tree, which keeps the tree balanced and the depth minimal.
2. **Edge Processing in `maxNumEdgesToRemove`**:

   - **Sorting**:

     ```
     auto lambda = [&](vector<int>&vec1,vector<int>&vec2){
         return vec1[0] > vec2[0];
     }; 
     sort(begin(edges),end(edges),lambda);
     ```

     Edges are sorted by type in descending order, ensuring type 3 edges (common edges) are processed first. This is crucial because type 3 edges are more versatile, as they can be used by both Alice and Bob.
   - **Processing Edges**:

     ```
     for(auto &vec:edges){
         int type = vec[0];
         int u = vec[1];
         int v = vec[2];

         if(type == 3){
             bool addEdge = false;
             if(Alice.find(u) != Alice.find(v)){
                 Alice.Union(u,v);
                 addEdge = true;
             }
             if(Bob.find(u) != Bob.find(v)){
                 Bob.Union(u,v);
                 addEdge = true;
             }
             if(addEdge == true) edgeCount++;
         }else if(type == 2){
             if(Bob.find(u) != Bob.find(v)){
                 Bob.Union(u,v);
                 edgeCount++;
             }
         }else{
             if(Alice.find(u) != Alice.find(v)){
                 Alice.Union(u,v);
                 edgeCount++;
             }
         }
         if(Alice.isSingleComponent() && Bob.isSingleComponent()){
             return edges.size() - edgeCount;
         }
     }
     ```

     The code processes type 3 edges first, trying to merge the nodes in both Alice's and Bob's DSU structures. If a merge is successful (i.e., the nodes were not already in the same set), it increments the `edgeCount`. This ensures that the maximum number of common edges is utilized.
   - **Early Termination**:

     ```
     if(Alice.isSingleComponent() && Bob.isSingleComponent()){
         return edges.size() - edgeCount;
     }
     ```

     The code checks if both Alice's and Bob's graphs are fully connected after each edge addition. If both are fully connected, it returns the number of removable edges, thereby avoiding unnecessary iterations.

### Efficiency

- **Time Complexity**: The find and union operations with path compression and union by rank are nearly constant time, i.e., O(α(n)), where α is the inverse Ackermann function, which grows very slowly. Sorting the edges takes O(m log m), where m is the number of edges. Thus, the overall time complexity is O(m log m + α(n)).
- **Space Complexity**: The DSU class uses O(n) space for the parent and rank arrays, which is efficient in terms of space usage.

### Conclusion

This implementation is efficient because it leverages the DSU data structure with path compression and union by rank to keep operations nearly constant time. Sorting the edges and processing type 3 edges first ensures that the algorithm maximizes the use of versatile edges, reducing redundant edges early. The early termination condition further enhances performance by stopping the process as soon as both graphs are fully connected.
