
// src/lib/manufacturing-data.ts
import type { ProductionLine } from "@/types";

export let productionLines: ProductionLine[] = [
  {
    id: "line-01",
    name: "Assembly Line Alpha",
    location: "CleanEnergy Factory, Germany",
    status: "Active",
    outputPerHour: 50,
    currentProduct: "Eco-Friendly Smart Watch Series 5",
    lastMaintenance: "2024-07-15T08:00:00Z",
  },
  {
    id: "line-02",
    name: "Drone Assembly Delta",
    location: "AeroDynamics Plant 1, USA",
    status: "Active",
    outputPerHour: 20,
    currentProduct: "Pro-Grade 4K Drone",
    lastMaintenance: "2024-06-20T10:00:00Z",
  },
  {
    id: "line-03",
    name: "Furnishing Line Gamma",
    location: "EcoHome Workshop, China",
    status: "Idle",
    outputPerHour: 30,
    currentProduct: "Modular Shelving Unit",
    lastMaintenance: "2024-07-01T14:00:00Z",
  },
  {
    id: "line-04",
    name: "Textile Line Beta",
    location: "Sustainable Threads Mill, India",
    status: "Maintenance",
    outputPerHour: 150,
    currentProduct: "Organic Cotton T-Shirt",
    lastMaintenance: "2024-07-22T09:00:00Z",
  },
];
