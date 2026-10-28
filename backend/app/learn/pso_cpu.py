# backend/learn/pso_cpu.py

from mealpy import FloatVar, IntegerVar, PSO


class PSOHyperparameterSearch:
    """
    PSO Hyperparameter Search using Mealpy.

    Optimized parameters (example):
    - learning_rate (float)
    - dropout (float)
    - hidden_size (discrete via index)
    """

    def __init__(
        self,
        bounds,
        fitness_fn,
        population_size=5,
        max_iters=10,
    ):
        """
        bounds: dict
            {
                "learning_rate": (min, max),
                "dropout": (min, max),
                "hidden_size": [128, 256, 512]
            }

        fitness_fn: callable(params_dict) -> float
            MUST return scalar LOSS (lower is better)

        population_size: number of particles
        max_iters: number of PSO iterations
        """

        self.bounds = bounds
        self.fitness_fn = fitness_fn
        self.population_size = population_size
        self.max_iters = max_iters

        # discrete mapping
        self.hidden_sizes = bounds.get("hidden_size", [])

        # =================================================
        # BUILD MEALPY SEARCH SPACE
        # =================================================
        variables = []

        if "learning_rate" in bounds:
            variables.append(
                FloatVar(
                    lb=bounds["learning_rate"][0],
                    ub=bounds["learning_rate"][1],
                    name="learning_rate",
                )
            )

        if "dropout" in bounds:
            variables.append(
                FloatVar(
                    lb=bounds["dropout"][0],
                    ub=bounds["dropout"][1],
                    name="dropout",
                )
            )

        if "hidden_size" in bounds:
            variables.append(
                IntegerVar(
                    lb=0,
                    ub=len(self.hidden_sizes) - 1,
                    name="hidden_size_idx",
                )
            )

        self.variables = variables

    # =====================================================
    # RUN OPTIMIZATION
    # =====================================================
    def optimize(self, verbose=True):
        """
        Returns:
            best_params: dict
            best_score: float
        """

        # ---------------------------------------------
        # Mealpy objective function (MINIMIZATION)
        # ---------------------------------------------
        def objective(solution):
            params = {}
            idx = 0

            if "learning_rate" in self.bounds:
                params["learning_rate"] = float(solution[idx])
                idx += 1

            if "dropout" in self.bounds:
                params["dropout"] = float(solution[idx])
                idx += 1

            if "hidden_size" in self.bounds:
                hs_idx = int(round(solution[idx]))
                hs_idx = max(0, min(hs_idx, len(self.hidden_sizes) - 1))
                params["hidden_size"] = self.hidden_sizes[hs_idx]

            return self.fitness_fn(params)

        problem = {
            "bounds": self.variables,
            "obj_func": objective,
            "minmax": "min",
        }

        model = PSO.OriginalPSO(
            epoch=self.max_iters,
            pop_size=self.population_size,
        )

        best = model.solve(problem)

        # ---------------------------------------------
        # Decode best solution
        # ---------------------------------------------
        best_params = {}
        idx = 0

        if "learning_rate" in self.bounds:
            best_params["learning_rate"] = float(best.solution[idx])
            idx += 1

        if "dropout" in self.bounds:
            best_params["dropout"] = float(best.solution[idx])
            idx += 1

        if "hidden_size" in self.bounds:
            hs_idx = int(round(best.solution[idx]))
            hs_idx = max(0, min(hs_idx, len(self.hidden_sizes) - 1))
            best_params["hidden_size"] = self.hidden_sizes[hs_idx]

        if verbose:
            #print("[PSO] Best params:", best_params)
            #print("[PSO] Best score:", best.target.fitness)

        return best_params, best.target.fitness
# =====================================================
# END FILE
# =====================================================
