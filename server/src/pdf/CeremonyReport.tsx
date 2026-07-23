import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { CategoryRecap } from "../recap.js";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 12, fontFamily: "Helvetica" },
  title: { fontSize: 22, marginBottom: 24, textAlign: "center", fontFamily: "Helvetica-Bold" },
  category: { marginBottom: 20 },
  categoryTitle: { fontSize: 15, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  place: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  rank: { width: 28, fontFamily: "Helvetica-Bold" },
  nomineeImage: { width: 32, height: 32, marginRight: 8, borderRadius: 4 },
  nomineeName: { flexGrow: 1 },
  percentage: { width: 48, textAlign: "right", color: "#555555" },
});

function rankLabel(rank: number) {
  if (rank === 1) return "1er";
  return `${rank}e`;
}

export function CeremonyReport({ categories, resolveImagePath }: { categories: CategoryRecap[]; resolveImagePath: (url: string) => string | undefined }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Palmarès de la cérémonie</Text>
        {categories.map((category) => (
          <View key={category.categoryId} style={styles.category} wrap={false}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            {category.podium.map((place) =>
              place.nominees.map((nominee) => {
                const imagePath = nominee.imageUrl ? resolveImagePath(nominee.imageUrl) : undefined;
                return (
                  <View key={nominee.id} style={styles.place}>
                    <Text style={styles.rank}>{rankLabel(place.rank)}</Text>
                    {imagePath ? <Image src={imagePath} style={styles.nomineeImage} /> : null}
                    <Text style={styles.nomineeName}>{nominee.name}</Text>
                    <Text style={styles.percentage}>{nominee.percentage}%</Text>
                  </View>
                );
              }),
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}
