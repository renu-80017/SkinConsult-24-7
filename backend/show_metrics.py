"""
Show metrics (accuracy, precision, recall, F1, loss...) of all trained models
logged in MLflow, and save them to model_metrics.csv.

Run from the project root:
    python show_metrics.py
"""
import os
import mlflow
import pandas as pd

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 250)
pd.set_option("display.max_colwidth", 40)

# Your project has both mlflow.db and mlruns, so check both stores
tracking_uris = []
if os.path.exists("mlflow.db"):
    tracking_uris.append("sqlite:///mlflow.db")
if os.path.exists("mlruns"):
    tracking_uris.append("file:./mlruns")

all_tables = []

for uri in tracking_uris:
    mlflow.set_tracking_uri(uri)
    try:
        runs = mlflow.search_runs(search_all_experiments=True)
    except Exception as e:
        print("Could not read", uri, "->", e)
        continue

    if runs.empty:
        print("No runs found in", uri)
        continue

    # Experiment names instead of IDs
    names = {}
    for exp_id in runs["experiment_id"].unique():
        exp = mlflow.get_experiment(exp_id)
        names[exp_id] = exp.name if exp else exp_id
    runs["experiment"] = runs["experiment_id"].map(names)

    metric_cols = [c for c in runs.columns if c.startswith("metrics.")]
    keep = ["experiment", "tags.mlflow.runName", "status", "start_time"] + metric_cols
    keep = [c for c in keep if c in runs.columns]

    table = runs[keep].copy()
    table.columns = [c.replace("metrics.", "").replace("tags.mlflow.runName", "run_name") for c in table.columns]
    table["store"] = uri
    all_tables.append(table)

if not all_tables:
    print("No MLflow runs found. Check that your training scripts logged to MLflow.")
else:
    result = pd.concat(all_tables, ignore_index=True)
    result = result.sort_values(["experiment", "start_time"], ascending=[True, False])

    for exp_name, group in result.groupby("experiment"):
        print("\n" + "=" * 80)
        print("EXPERIMENT:", exp_name)
        print("=" * 80)
        group = group.dropna(axis=1, how="all")
        print(group.drop(columns=["store"]).round(4).to_string(index=False))

    result.round(4).to_csv("model_metrics.csv", index=False)
    print("\nSaved all metrics to model_metrics.csv")