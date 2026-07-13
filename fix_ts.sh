sed -i 's/const historyItems = snap.docs.map(d => ({ docId: d.id, ...d.data() }));/const historyItems: any\[\] = snap.docs.map(d => ({ docId: d.id, ...d.data() }));/g' src/pages/WatchHistory.tsx
sed -i 's/const items = snap.docs.map(d => ({ docId: d.id, ...d.data() }));/const items: any\[\] = snap.docs.map(d => ({ docId: d.id, ...d.data() }));/g' src/pages/WatchLater.tsx
