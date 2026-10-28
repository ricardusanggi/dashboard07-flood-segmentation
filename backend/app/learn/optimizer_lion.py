# backend/learn/optimizer_lion.py
import torch

# ============================
# LION OPTIMIZER (PyTorch)
# ============================
class Lion(torch.optim.Optimizer):
    """
    Lion Optimizer: Evolved Sign Momentum
    Paper: https://arxiv.org/abs/2302.06675
    """

    def __init__(self, params,
                 lr=1e-4,
                 betas=(0.9, 0.99),
                 weight_decay=0.0):

        defaults = dict(
            lr=lr,
            betas=betas,
            weight_decay=weight_decay
        )
        super(Lion, self).__init__(params, defaults)

    @torch.no_grad()
    def step(self, closure=None):

        for group in self.param_groups:
            lr = group["lr"]
            beta1, beta2 = group["betas"]
            wd = group["weight_decay"]

            for p in group["params"]:
                if p.grad is None:
                    continue

                grad = p.grad

                # Weight decay
                if wd != 0:
                    grad = grad.add(p, alpha=wd)

                # Get state
                state = self.state[p]
                if len(state) == 0:
                    state["exp_avg"] = torch.zeros_like(p)

                exp_avg = state["exp_avg"]

                # Update
                update = exp_avg.mul(beta1).add(grad, alpha=1 - beta1).sign()
                p.add_(update, alpha=-lr)

                # Momentum update
                exp_avg.mul_(beta2).add_(grad, alpha=1 - beta2)

        return None